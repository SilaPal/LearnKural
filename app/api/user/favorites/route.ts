import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { userFavorites, childProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveId } from '@/lib/resolve-active-id';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const effectiveId = getEffectiveId(request);
    if (!effectiveId) return NextResponse.json(null, { status: 401 });

    if (effectiveId.startsWith('cp_')) {
        const [profile] = await db.select({ favoriteKurals: childProfiles.favoriteKurals }).from(childProfiles).where(eq(childProfiles.id, effectiveId));
        return NextResponse.json(profile?.favoriteKurals || []);
    }

    const [favorites] = await db.select().from(userFavorites).where(eq(userFavorites.userId, effectiveId));
    return NextResponse.json(favorites?.kuralIds || []);
}

export async function POST(request: NextRequest) {
    const effectiveId = getEffectiveId(request);
    if (!effectiveId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { kuralIds } = body;

        if (effectiveId.startsWith('cp_')) {
            const [profile] = await db.update(childProfiles).set({
                favoriteKurals: kuralIds || [],
            }).where(eq(childProfiles.id, effectiveId)).returning();
            return NextResponse.json(profile.favoriteKurals);
        }

        let [favorites] = await db.select().from(userFavorites).where(eq(userFavorites.userId, effectiveId));

        if (!favorites) {
            [favorites] = await db.insert(userFavorites).values({
                userId: effectiveId,
                kuralIds: kuralIds || [],
            }).returning();
        } else {
            [favorites] = await db.update(userFavorites).set({
                kuralIds: kuralIds !== undefined ? kuralIds : favorites.kuralIds,
                updatedAt: new Date(),
            }).where(eq(userFavorites.userId, effectiveId)).returning();
        }

        return NextResponse.json(favorites.kuralIds);
    } catch (e) {
        console.error('Error updating favorites:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
