import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;
    
    // Fallback block if old unassigned session cookie exists (temp backwards compatibility)
    try {
        if (!sessionToken.includes('.')) {
             const dec = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
             return dec.userId || null;
        }
    } catch {}

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}

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
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json(null, { status: 401 });

    const [user] = await db
        .select({ coins: users.coins, weeklyXP: users.weeklyXP, streak: users.streak, longestStreak: users.longestStreak })
        .from(users)
        .where(eq(users.id, userId));

    return NextResponse.json({
        coins: user?.coins ?? 0,
        weeklyXP: user?.weeklyXP ?? 0,
        streak: user?.streak ?? 0,
        longestStreak: user?.longestStreak ?? 0,
    });
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { amount } = body; // coins to add (negative to subtract)

        if (typeof amount !== 'number') {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const [user] = await db
            .select({
                coins: users.coins,
                weeklyXP: users.weeklyXP,
                streak: users.streak,
                longestStreak: users.longestStreak,
                lastActiveDate: users.lastActiveDate,
            })
            .from(users)
            .where(eq(users.id, userId));

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const newCoins = Math.max(0, user.coins + amount);
        // Weekly XP only increases (never subtract from it)
        const newWeeklyXP = amount > 0 ? user.weeklyXP + amount : user.weeklyXP;

        const today = todayUTC();
        const { streak, longestStreak } = calcStreak(
            user.lastActiveDate,
            user.streak,
            user.longestStreak,
        );

        await db.update(users)
            .set({
                coins: newCoins,
                weeklyXP: newWeeklyXP,
                streak,
                longestStreak,
                lastActiveDate: today,
            })
            .where(eq(users.id, userId));

        return NextResponse.json({ coins: newCoins, weeklyXP: newWeeklyXP, streak, longestStreak });
    } catch (e) {
        console.error('Error updating coins:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
