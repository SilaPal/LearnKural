import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { classrooms, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    // Fallback block if old unassigned session cookie exists
    try {
        if (!sessionToken.includes('.')) {
            const dec = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
            return dec.userId || null;
        }
    } catch { }

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user || (user.role !== 'teacher' && user.role !== 'school_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, endDate } = body;

        if (!name) {
            return NextResponse.json({ error: 'Classroom name is required' }, { status: 400 });
        }

        if (!user.schoolId) {
            return NextResponse.json({ error: 'User is not associated with a school' }, { status: 400 });
        }

        // Generate a random ID for the classroom
        const classroomId = 'cls_' + Math.random().toString(36).substring(2, 10);

        const [newClassroom] = await db.insert(classrooms).values({
            id: classroomId,
            schoolId: user.schoolId,
            name,
            teacherId: userId,
            endDate: endDate ? new Date(endDate) : null,
        }).returning();

        return NextResponse.json({ success: true, classroom: newClassroom });

    } catch (error) {
        console.error('Error creating classroom:', error);
        return NextResponse.json({ error: 'Failed to create classroom' }, { status: 500 });
    }
}
