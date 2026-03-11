import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { childProfiles, avatars, users, userProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolveActiveId } from '@/lib/resolve-active-id';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const session = resolveActiveId(request);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const profiles = await db
            .select({
                id: childProfiles.id,
                nickname: childProfiles.nickname,
                activeAvatarId: childProfiles.activeAvatarId,
                avatarThumbnail: avatars.thumbnailUrl,
                avatarExpiresAt: childProfiles.avatarExpiresAt,
                coins: childProfiles.coins,
                badges: childProfiles.badges,
                streak: childProfiles.streak,
                longestStreak: childProfiles.longestStreak,
                completedChapters: childProfiles.completedChapters,
                region: childProfiles.region,
                relationship: childProfiles.relationship,
            })
            .from(childProfiles)
            .leftJoin(avatars, eq(childProfiles.activeAvatarId, avatars.id))
            .where(eq(childProfiles.parentUserId, session.userId));

        // Inline expiry check: if avatarExpiresAt has passed, treat as 'none'
        const now = new Date();
        const resolved = profiles.map(p => ({
            ...p,
            activeAvatarId: (p.avatarExpiresAt && p.avatarExpiresAt < now) ? 'none' : p.activeAvatarId,
            avatarThumbnail: (p.avatarExpiresAt && p.avatarExpiresAt < now) ? null : p.avatarThumbnail,
        }));

        const [parentUser] = await db.select({
            nickname: users.name,
            picture: users.picture,
            coins: users.coins,
            streak: users.streak,
            longestStreak: users.longestStreak,
        }).from(users).where(eq(users.id, session.userId));

        const [parentProgress] = await db.select({
            completedChapters: userProgress.completedChapters,
        }).from(userProgress).where(eq(userProgress.userId, session.userId));

        const parentData = {
            id: session.userId,
            nickname: parentUser?.nickname || 'Parent',
            avatarThumbnail: parentUser?.picture || null,
            coins: parentUser?.coins || 0,
            streak: parentUser?.streak || 0,
            longestStreak: parentUser?.longestStreak || 0,
            completedChapters: parentProgress?.completedChapters || [],
            badges: [], // Parent badges are global, handled in modal
            region: 'Global',
            isParentAccount: true
        };

        return NextResponse.json({ profiles: resolved, parent: parentData });
    } catch (error) {
        console.error('Parent Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch parent dashboard data' }, { status: 500 });
    }
}
