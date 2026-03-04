import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
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
