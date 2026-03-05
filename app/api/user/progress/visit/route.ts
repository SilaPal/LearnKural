import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { userProgress, childProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveId } from '@/lib/resolve-active-id';

export async function POST(request: NextRequest) {
    const effectiveId = getEffectiveId(request);
    if (!effectiveId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { kuralId } = await request.json();
        if (!kuralId) return NextResponse.json({ error: 'Kural ID is required' }, { status: 400 });

        const idNum = Number(kuralId);

        if (effectiveId.startsWith('cp_')) {
            const [profile] = await db.select().from(childProfiles).where(eq(childProfiles.id, effectiveId));
            if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

            const current = profile.completedChapters as number[] || [];
            if (!current.includes(idNum)) {
                await db.update(childProfiles)
                    .set({ completedChapters: Array.from(new Set([...current, idNum])) })
                    .where(eq(childProfiles.id, effectiveId));
            }
            return NextResponse.json({ success: true });
        }

        const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, effectiveId));

        if (!progress) {
            await db.insert(userProgress).values({
                userId: effectiveId,
                completedChapters: [idNum],
                completedLetters: [],
                badges: []
            });
        } else {
            const current = progress.completedChapters as number[] || [];
            if (!current.includes(idNum)) {
                await db.update(userProgress)
                    .set({
                        completedChapters: Array.from(new Set([...current, idNum])),
                        updatedAt: new Date()
                    })
                    .where(eq(userProgress.userId, effectiveId));
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error recording visit:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
