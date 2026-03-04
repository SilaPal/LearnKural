import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, userAvatars } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

        // Allow 'none' to deactivate avatar
        if (avatarId === 'none' || avatarId === null) {
            await db.update(users)
                .set({ activeAvatarId: 'none' })
                .where(eq(users.id, userId));
            return NextResponse.json({ activeAvatarId: 'none' });
        }

        if (!avatarId) {
            return NextResponse.json({ error: 'Avatar ID is required' }, { status: 400 });
        }

        if (avatarId !== 'default') {
            const [user] = await db.select({ tier: users.tier }).from(users).where(eq(users.id, userId));

            // Check if user has unlocked it OR is premium
            if (user?.tier !== 'paid') {
                const existingUnlock = await db.select().from(userAvatars)
                    .where(and(eq(userAvatars.userId, userId), eq(userAvatars.avatarId, avatarId)));

                if (existingUnlock.length === 0) {
                    return NextResponse.json({ error: 'Avatar not unlocked' }, { status: 403 });
                }
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
