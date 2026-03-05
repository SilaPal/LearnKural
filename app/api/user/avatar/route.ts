import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, userAvatars, childProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Returns { userId, activeProfileId } from session cookie. Supports old base64 cookies too. */
async function getSessionData(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    // Backwards compat: old unsigned base64 cookie
    try {
        if (!sessionToken.includes('.')) {
            const dec = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
            return { userId: dec.userId || null, activeProfileId: null };
        }
    } catch { }

    const sessionData = verifySession(sessionToken);
    if (!sessionData?.userId) return null;
    return { userId: sessionData.userId, activeProfileId: sessionData.activeProfileId || null };
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
    const session = await getSessionData(request);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, activeProfileId } = session;
    const now = new Date();

    if (activeProfileId) {
        // ── Child profile is active ──
        const [[parent], [child]] = await Promise.all([
            db.select().from(users).where(eq(users.id, userId)),
            db.select().from(childProfiles).where(eq(childProfiles.id, activeProfileId)),
        ]);
        if (!parent) return NextResponse.json(null, { status: 401 });

        const { googleId, ...safeParent } = parent;
        const isExpired = !!(child?.avatarExpiresAt && child.avatarExpiresAt < now);
        return NextResponse.json({
            ...safeParent,
            // Avatar from CHILD profile — 'none' if expired
            activeAvatarId: isExpired ? 'none' : (child?.activeAvatarId || 'none'),
            activeProfileId,
            activeProfileNickname: child?.nickname || null,
        });
    }

    // ── No child active — return parent row with expiry check ──
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return NextResponse.json(null, { status: 401 });

    const { googleId, ...safeUser } = user;
    const isParentExpired = !!(user.avatarExpiresAt && user.avatarExpiresAt < now);
    return NextResponse.json({
        ...safeUser,
        activeAvatarId: isParentExpired ? 'none' : (user.activeAvatarId || 'none'),
        activeProfileId: null,
        activeProfileNickname: null,
    });
}

export async function POST(request: NextRequest) {
    const session = await getSessionData(request);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, activeProfileId } = session;

    try {
        const body = await request.json();
        const { avatarId } = body;

        // Tier check: always use parent's tier (child inherits premium)
        const [parent] = await db.select({ tier: users.tier }).from(users).where(eq(users.id, userId));

        // Allow 'none' to deactivate avatar
        if (avatarId === 'none' || avatarId === null) {
            if (activeProfileId) {
                await db.update(childProfiles).set({ activeAvatarId: 'none', avatarExpiresAt: null }).where(eq(childProfiles.id, activeProfileId));
            } else {
                await db.update(users).set({ activeAvatarId: 'none', avatarExpiresAt: null }).where(eq(users.id, userId));
            }
            return NextResponse.json({ activeAvatarId: 'none' });
        }

        if (!avatarId) {
            return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 });
        }

        if (avatarId !== 'default') {
            // If parent is not premium, check if they've unlocked this avatar
            if (parent?.tier !== 'paid') {
                const existingUnlock = await db.select().from(userAvatars)
                    .where(and(eq(userAvatars.userId, userId), eq(userAvatars.avatarId, avatarId)));

                if (existingUnlock.length === 0) {
                    return NextResponse.json({ error: 'Avatar not unlocked' }, { status: 403 });
                }
            }
        }

        const isPremium = parent?.tier === 'paid';
        const avatarExpiresAt = isPremium ? null : new Date(Date.now() + THIRTY_DAYS_MS);

        // Write to child profile or parent user depending on who is active
        if (activeProfileId) {
            await db.update(childProfiles).set({ activeAvatarId: avatarId, avatarExpiresAt }).where(eq(childProfiles.id, activeProfileId));
        } else {
            await db.update(users).set({ activeAvatarId: avatarId, avatarExpiresAt }).where(eq(users.id, userId));
        }

        return NextResponse.json({ activeAvatarId: avatarId, avatarExpiresAt });
    } catch (e) {
        console.error('Error updating active avatar:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
