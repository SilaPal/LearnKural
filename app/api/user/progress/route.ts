import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { userProgress } from '@/db/schema';
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

    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

    return NextResponse.json(progress || { completedLetters: [], badges: [], completedChapters: [] });
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { completedLetters, badges, completedChapters } = body;

        let [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

        if (!progress) {
            [progress] = await db.insert(userProgress).values({
                userId,
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
            }).where(eq(userProgress.userId, userId)).returning();
        }

        return NextResponse.json(progress);
    } catch (e) {
        console.error('Error updating progress:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
