import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, avatars, userAvatars } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest) {
    const session = request.cookies.get('thirukural-session')?.value;
    if (!session) return null;
    try {
        const { userId } = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
        return userId;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { avatarId } = body;

        if (!avatarId) {
            return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 });
        }

        // Fetch user and avatar logic
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const [avatar] = await db.select().from(avatars).where(eq(avatars.id, avatarId));
        if (!avatar) return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });

        // Check if premium and user is free
        if (avatar.isPremiumOnly && user.tier === 'free') {
            return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
        }

        // Check if already unlocked
        const existingUnlock = await db.select().from(userAvatars)
            .where(and(eq(userAvatars.userId, userId), eq(userAvatars.avatarId, avatarId)));
        if (existingUnlock.length > 0) {
            return NextResponse.json({ error: 'Already unlocked' }, { status: 400 });
        }

        // Check coin balance
        if (user.coins < avatar.price) {
            return NextResponse.json({ error: 'Not enough coins' }, { status: 400 });
        }

        // Transaction simulation (deduct coins and unlock)
        await db.update(users).set({ coins: user.coins - avatar.price }).where(eq(users.id, userId));
        await db.insert(userAvatars).values({ userId, avatarId });

        return NextResponse.json({ success: true, coinsRemaining: user.coins - avatar.price });
    } catch (e) {
        console.error('Failed to buy avatar', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
