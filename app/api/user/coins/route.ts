import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, childProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveId, resolveActiveId } from '@/lib/resolve-active-id';

export const dynamic = 'force-dynamic';

/** Returns today's date as YYYY-MM-DD in UTC */
function todayUTC() {
    return new Date().toISOString().slice(0, 10);
}

/** Recalculates streak given the previous lastActiveDate. Returns { streak, longestStreak }. */
function calcStreak(
    lastActiveDate: string | null,
    currentStreak: number,
    longestStreak: number,
): { streak: number; longestStreak: number } {
    const today = todayUTC();
    if (lastActiveDate === today) {
        // Already counted today — no change
        return { streak: currentStreak, longestStreak };
    }
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
    const newStreak = lastActiveDate === yesterday ? currentStreak + 1 : 1;
    const newLongest = Math.max(longestStreak, newStreak);
    return { streak: newStreak, longestStreak: newLongest };
}

export async function GET(request: NextRequest) {
    const effectiveId = getEffectiveId(request);
    if (!effectiveId) return NextResponse.json(null, { status: 401 });

    // Check childProfiles first
    if (effectiveId.startsWith('cp_')) {
        const [profile] = await db
            .select({ coins: childProfiles.coins, weeklyXP: childProfiles.weeklyXP, streak: childProfiles.streak, longestStreak: childProfiles.longestStreak })
            .from(childProfiles)
            .where(eq(childProfiles.id, effectiveId));

        if (profile) return NextResponse.json(profile);
    }

    // Fallback to users
    const [user] = await db
        .select({ coins: users.coins, weeklyXP: users.weeklyXP, streak: users.streak, longestStreak: users.longestStreak })
        .from(users)
        .where(eq(users.id, effectiveId));

    return NextResponse.json({
        coins: user?.coins ?? 0,
        weeklyXP: user?.weeklyXP ?? 0,
        streak: user?.streak ?? 0,
        longestStreak: user?.longestStreak ?? 0,
    });
}

export async function POST(request: NextRequest) {
    const effectiveId = getEffectiveId(request);
    if (!effectiveId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { amount } = body; // coins to add (negative to subtract)

        if (typeof amount !== 'number') {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const isChild = effectiveId.startsWith('cp_');
        let current;

        if (isChild) {
            [current] = await db.select().from(childProfiles).where(eq(childProfiles.id, effectiveId));
        } else {
            [current] = await db.select().from(users).where(eq(users.id, effectiveId));
        }

        if (!current) return NextResponse.json({ error: 'Identity not found' }, { status: 404 });

        const newCoins = Math.max(0, current.coins + amount);
        const newWeeklyXP = amount > 0 ? (current.weeklyXP || 0) + amount : current.weeklyXP;

        const today = todayUTC();
        const { streak, longestStreak } = calcStreak(
            current.lastActiveDate,
            current.streak,
            current.longestStreak,
        );

        if (isChild) {
            await db.update(childProfiles)
                .set({
                    coins: newCoins,
                    weeklyXP: newWeeklyXP,
                    streak,
                    longestStreak,
                    lastActiveDate: today,
                })
                .where(eq(childProfiles.id, effectiveId));
        } else {
            await db.update(users)
                .set({
                    coins: newCoins,
                    weeklyXP: newWeeklyXP,
                    streak,
                    longestStreak,
                    lastActiveDate: today,
                })
                .where(eq(users.id, effectiveId));
        }

        return NextResponse.json({ coins: newCoins, weeklyXP: newWeeklyXP, streak, longestStreak });
    } catch (e) {
        console.error('Error updating stats:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

