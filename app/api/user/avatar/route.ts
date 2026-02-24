import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, userAvatars } from '@/db/schema';
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

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json(null, { status: 401 });

    const [user] = await db.select({ activeAvatarId: users.activeAvatarId }).from(users).where(eq(users.id, userId));
    return NextResponse.json({ activeAvatarId: user?.activeAvatarId || 'default' });
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

        if (avatarId !== 'default') {
            // Check if user has unlocked it
            const existingUnlock = await db.select().from(userAvatars)
                .where(and(eq(userAvatars.userId, userId), eq(userAvatars.avatarId, avatarId)));

            if (existingUnlock.length === 0) {
                return NextResponse.json({ error: 'Avatar not unlocked' }, { status: 403 });
            }
        }

        await db.update(users)
            .set({ activeAvatarId: avatarId })
            .where(eq(users.id, userId));

        return NextResponse.json({ activeAvatarId: avatarId });
    } catch (e) {
        console.error('Error updating active avatar:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
