import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { classrooms, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    try {
        if (!sessionToken.includes('.')) {
            const dec = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
            return dec.userId || null;
        }
    } catch { }

    const sessionData = await verifySession(sessionToken);
    return sessionData?.userId || null;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const classroomId = params.id;

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user || !user.schoolId || (user.role !== 'school_admin' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, startDate, endDate, teacherId } = body;

        // Verify the classroom belongs to the school
        const [classroom] = await db.select().from(classrooms)
            .where(and(eq(classrooms.id, classroomId), eq(classrooms.schoolId, user.schoolId)))
            .limit(1);

        if (!classroom) {
            return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (teacherId !== undefined) updateData.teacherId = teacherId || null;

        await db.update(classrooms)
            .set(updateData)
            .where(eq(classrooms.id, classroomId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating classroom:', error);
        return NextResponse.json({ error: 'Failed to update classroom' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const classroomId = params.id;

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user || !user.schoolId || (user.role !== 'school_admin' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Verify the classroom belongs to the school
        const [classroom] = await db.select().from(classrooms)
            .where(and(eq(classrooms.id, classroomId), eq(classrooms.schoolId, user.schoolId)))
            .limit(1);

        if (!classroom) {
            return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
        }

        await db.delete(classrooms).where(eq(classrooms.id, classroomId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting classroom:', error);
        return NextResponse.json({ error: 'Failed to delete classroom' }, { status: 500 });
    }
}
