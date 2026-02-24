import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { userFavorites } from '@/db/schema';
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
