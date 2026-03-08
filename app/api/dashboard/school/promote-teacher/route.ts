import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    try {
        if (!sessionToken.includes('.')) {
            const dec = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
            return dec.userId || null;
        }
    } catch { }

    const session = await verifySession(sessionToken);
    return session?.userId || null;
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const user = userRecord[0];

        if (!user || (user.role !== 'school_admin' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { teacherId } = body;

        if (!teacherId || typeof teacherId !== 'string') {
            return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
        }

        // 1. Check if the target teacher exists and is actually a teacher
        const targetTeacherArr = await db.select().from(users).where(
            and(
                eq(users.id, teacherId),
                eq(users.role, 'teacher')
            )
        ).limit(1);

        if (targetTeacherArr.length === 0) {
            return NextResponse.json({ error: 'Teacher not found or already promoted' }, { status: 404 });
        }

        const targetTeacher = targetTeacherArr[0];

        // 2. Verify that the target teacher belongs to the SAME school if caller is just a school_admin
        if (user.role === 'school_admin' && targetTeacher.schoolId !== user.schoolId) {
            return NextResponse.json({ error: 'Teacher not found in your academy' }, { status: 404 });
        }

        // 2. Promote the teacher to school_admin
        await db.update(users)
            .set({
                role: 'school_admin'
            })
            .where(eq(users.id, teacherId));

        return NextResponse.json({ success: true, message: 'Teacher promoted to School Admin successfully' });

    } catch (error: any) {
        console.error('Error in /api/dashboard/school/promote-teacher:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
