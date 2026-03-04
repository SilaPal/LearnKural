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
    } catch {}

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}

const DEFAULT_AVATARS = [
    {
        id: 'default',
        name: 'Banana',
        description: 'Your starter animated avatar, Banana!',
        price: 0,
        imageUrl: '🍌',
        type: 'lottie' as const,
        metadata: {
            idle: '/assets/lottie/avatars/Banana/Idle.lottie',
            happy: '/assets/lottie/avatars/Banana/Happy.lottie',
            excited: '/assets/lottie/avatars/Banana/Happy.lottie',
            sad: '/assets/lottie/avatars/Banana/Sad.lottie',
            thinking: '/assets/lottie/avatars/Banana/Thinking.lottie',
        },
        isPremiumOnly: false,
    },
    {
        id: 'lottie_arun',
        name: 'Arun',
        description: 'Premium animated Arun avatar with full expressions!',
        price: 200,
        imageUrl: '🧘',
        type: 'lottie' as const,
        metadata: {
            idle: '/assets/lottie/avatars/Arun/Idle.lottie',
            happy: '/assets/lottie/avatars/Arun/Happy.lottie',
            excited: '/assets/lottie/avatars/Arun/Happy.lottie',
            sad: '/assets/lottie/avatars/Arun/Sad.lottie',
            thinking: '/assets/lottie/avatars/Arun/Thinking.lottie',
        },
        isPremiumOnly: false,
    },
    {
        id: 'lottie_parrot',
        name: 'Parrot',
        description: 'Premium animated Parrot avatar with full expressions!',
        price: 200,
        imageUrl: '🦜',
        type: 'lottie' as const,
        metadata: {
            idle: '/assets/lottie/avatars/Parrot/Idle.lottie',
            happy: '/assets/lottie/avatars/Parrot/Happy.lottie',
            excited: '/assets/lottie/avatars/Parrot/Happy.lottie',
            sad: '/assets/lottie/avatars/Parrot/Sad.lottie',
            thinking: '/assets/lottie/avatars/Parrot/Thinking.lottie',
        },
        isPremiumOnly: false,
    },
    {
        id: 'lottie_stickman',
        name: 'StickMan',
        description: 'Premium animated StickMan avatar with full expressions!',
        price: 500,
        imageUrl: '🏃',
        type: 'lottie' as const,
        metadata: {
            idle: '/assets/lottie/avatars/StickMan/Idle.lottie',
            happy: '/assets/lottie/avatars/StickMan/Happy.lottie',
            excited: '/assets/lottie/avatars/StickMan/Happy.lottie',
            sad: '/assets/lottie/avatars/StickMan/Sad.lottie',
            thinking: '/assets/lottie/avatars/StickMan/Thinking.lottie',
        },
        isPremiumOnly: true,
    },
    {
        id: 'lottie_stickgirl',
        name: 'StickGirl',
        description: 'Premium animated StickGirl avatar with full expressions!',
        price: 500,
        imageUrl: '🏃‍♀️',
        type: 'lottie' as const,
        metadata: {
            idle: '/assets/lottie/avatars/StickGirl/Idle.lottie',
            happy: '/assets/lottie/avatars/StickGirl/Happy.lottie',
            excited: '/assets/lottie/avatars/StickGirl/Happy.lottie',
            sad: '/assets/lottie/avatars/StickGirl/Sad.lottie',
            thinking: '/assets/lottie/avatars/StickGirl/Thinking.lottie',
        },
        isPremiumOnly: true,
    },
    {
        id: 'lottie_nila',
        name: 'Nila',
        description: 'Premium animated Nila avatar with full expressions!',
        price: 500,
        imageUrl: '👩',
        type: 'lottie' as const,
        metadata: {
            idle: '/assets/lottie/avatars/Nila/Idle.lottie',
            happy: '/assets/lottie/avatars/Nila/Happy.lottie',
            excited: '/assets/lottie/avatars/Nila/Happy.lottie',
            sad: '/assets/lottie/avatars/Nila/Sad.lottie',
            thinking: '/assets/lottie/avatars/Nila/Thinking.lottie',
        },
        isPremiumOnly: true,
    },
];

async function ensureAvatarsSeeded() {
    const existing = await db.select().from(avatars);
    if (existing.length === 0) {
        for (const av of DEFAULT_AVATARS) {
            await db.insert(avatars).values(av).onConflictDoNothing();
        }
        return await db.select().from(avatars);
    }
    return existing;
}

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);

    const allAvatars = await ensureAvatarsSeeded();

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
