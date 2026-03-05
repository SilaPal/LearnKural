import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { userProgress, childProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveId } from '@/lib/resolve-active-id';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const effectiveId = getEffectiveId(request);
    if (!effectiveId) return NextResponse.json(null, { status: 401 });

    if (effectiveId.startsWith('cp_')) {
        const [profile] = await db
            .select({
                completedLetters: childProfiles.completedLetters,
                completedChapters: childProfiles.completedChapters,
                badges: childProfiles.badges
            })
            .from(childProfiles)
            .where(eq(childProfiles.id, effectiveId));

        return NextResponse.json(profile || { completedLetters: [], badges: [], completedChapters: [] });
    }

    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, effectiveId));
    return NextResponse.json(progress || { completedLetters: [], badges: [], completedChapters: [] });
}

export async function POST(request: NextRequest) {
    const effectiveId = getEffectiveId(request);
    if (!effectiveId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { completedLetters, badges, completedChapters } = body;

        if (effectiveId.startsWith('cp_')) {
            const [profile] = await db
                .update(childProfiles)
                .set({
                    completedLetters: completedLetters !== undefined ? completedLetters : undefined,
                    completedChapters: completedChapters !== undefined ? completedChapters : undefined,
                    badges: badges !== undefined ? badges : undefined,
                })
                .where(eq(childProfiles.id, effectiveId))
                .returning();

            return NextResponse.json(profile);
        }

        let [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, effectiveId));

        if (!progress) {
            [progress] = await db.insert(userProgress).values({
                userId: effectiveId,
                completedLetters: completedLetters || [],
                completedChapters: completedChapters || [],
                badges: badges || [],
            }).returning();
        } else {
            [progress] = await db.update(userProgress).set({
                completedLetters: completedLetters !== undefined ? completedLetters : progress.completedLetters,
                completedChapters: completedChapters !== undefined ? completedChapters : progress.completedChapters,
                badges: badges !== undefined ? badges : progress.badges,
                updatedAt: new Date(),
            }).where(eq(userProgress.userId, effectiveId)).returning();
        }

        return NextResponse.json(progress);
    } catch (e) {
        console.error('Error updating progress:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

