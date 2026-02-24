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

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { region } = body;

        if (!region) {
            return NextResponse.json({ error: 'Region is required' }, { status: 400 });
        }

        await db.update(users)
            .set({ region })
            .where(eq(users.id, userId));

        return NextResponse.json({ success: true, region });
    } catch (e) {
        console.error('Error updating region:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
