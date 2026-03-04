import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { userFavorites } from '@/db/schema';
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

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json(null, { status: 401 });

    const [favorites] = await db.select().from(userFavorites).where(eq(userFavorites.userId, userId));

    return NextResponse.json(favorites?.kuralIds || []);
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { kuralIds } = body;

        let [favorites] = await db.select().from(userFavorites).where(eq(userFavorites.userId, userId));

        if (!favorites) {
            [favorites] = await db.insert(userFavorites).values({
                userId,
                kuralIds: kuralIds || [],
            }).returning();
        } else {
            [favorites] = await db.update(userFavorites).set({
                kuralIds: kuralIds !== undefined ? kuralIds : favorites.kuralIds,
                updatedAt: new Date(),
            }).where(eq(userFavorites.userId, userId)).returning();
        }

        return NextResponse.json(favorites.kuralIds);
    } catch (e) {
        console.error('Error updating favorites:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
