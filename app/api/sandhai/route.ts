import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, avatars, userAvatars } from '@/db/schema';
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
    } catch { }

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);

    // Fetch all avatars from our local database explicitly seeded by seed-lottie-avatars.ts
    const allAvatars = await db.select().from(avatars);

    // Fetch user unlocked avatars
    let unlockedAvatarIds: string[] = ['default']; // Default is always unlocked
    if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        const userUnlocks = await db.select().from(userAvatars).where(eq(userAvatars.userId, userId));

        // Base unlocks: explicitly bought ones + default
        unlockedAvatarIds = ['default', ...userUnlocks.map(u => u.avatarId)];

        // Premium perk: If user is paid, they get ALL avatars unlocked automatically
        if (user && user.tier === 'paid') {
            unlockedAvatarIds = allAvatars.map(av => av.id);
        }
    }

    return NextResponse.json({
        catalog: allAvatars,
        unlocked: unlockedAvatarIds
    });
}
