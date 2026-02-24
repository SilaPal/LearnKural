import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { avatars, userAvatars } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);

    // Fetch all avatars
    const allAvatars = await db.select().from(avatars);

    // Fetch user unlocked avatars
    let unlockedAvatarIds: string[] = ['default']; // Default is always unlocked
    if (userId) {
        const userUnlocks = await db.select().from(userAvatars).where(eq(userAvatars.userId, userId));
        unlockedAvatarIds = ['default', ...userUnlocks.map(u => u.avatarId)];
    }

    return NextResponse.json({
        catalog: allAvatars,
        unlocked: unlockedAvatarIds
    });
}
