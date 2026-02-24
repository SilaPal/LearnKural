import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
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
    if (!userId) return NextResponse.json(null, { status: 401 });

    const [user] = await db.select({ coins: users.coins }).from(users).where(eq(users.id, userId));
    return NextResponse.json({ coins: user?.coins || 0 });
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { amount } = body; // amount to add (or subtract if negative)

        if (typeof amount !== 'number') {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const [user] = await db.select({ coins: users.coins }).from(users).where(eq(users.id, userId));
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const newBalance = Math.max(0, user.coins + amount);

        await db.update(users)
            .set({ coins: newBalance })
            .where(eq(users.id, userId));

        return NextResponse.json({ coins: newBalance });
    } catch (e) {
        console.error('Error updating coins:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
