import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, childProfiles, userProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getSessionData(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    // Backwards compat: old unsigned base64 cookie
    try {
        if (!sessionToken.includes('.')) {
            const parsed = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
            return { userId: parsed.userId, activeProfileId: null };
        }
    } catch { }

    const session = verifySession(sessionToken);
    if (!session?.userId) return null;
    return { userId: session.userId, activeProfileId: session.activeProfileId || null };
}

export async function GET(request: NextRequest) {
    const sessionData = await getSessionData(request);
    if (!sessionData?.userId) return NextResponse.json(null, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.id, sessionData.userId));
    if (!user) return NextResponse.json(null, { status: 401 });

    // Fetch parent badge data as fallback/default
    const [parentProgress] = await db.select().from(userProgress).where(eq(userProgress.userId, sessionData.userId));

    // If a child profile is active, fetch its nickname AND avatar AND stats
    let activeProfileNickname: string | null = null;
    let childData: any = {};
    if (sessionData.activeProfileId) {
        const [childProfile] = await db.select().from(childProfiles).where(eq(childProfiles.id, sessionData.activeProfileId));
        if (childProfile) {
            activeProfileNickname = childProfile.nickname;
            childData = {
                // Keep the parent's account name as 'name' but provide nickname for 'who is playing'
                activeAvatarId: childProfile.activeAvatarId,
                coins: childProfile.coins,
                weeklyXP: childProfile.weeklyXP,
                streak: childProfile.streak,
                longestStreak: childProfile.longestStreak,
                badges: childProfile.badges || [],
                region: childProfile.region || user.region, // Fallback to parent region
            };
        }
    }

    // Determine effective badges for the active player
    const effectiveBadges = sessionData.activeProfileId ? (childData.badges || []) : (parentProgress?.badges || []);
    const badgeCount = Array.isArray(effectiveBadges) ? effectiveBadges.length : 0;

    // Never expose googleId to the client
    const { googleId, ...safeUser } = user;
    return NextResponse.json({
        ...safeUser,
        ...childData,
        streak: childData.streak ?? user.streak,
        longestStreak: childData.longestStreak ?? user.longestStreak,
        badges: effectiveBadges,
        badgeCount,
        activeProfileId: sessionData.activeProfileId,
        activeProfileNickname,
    });
}
