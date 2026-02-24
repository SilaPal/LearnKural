import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { classrooms, users, classroomStudents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    try {
        if (schoolId) {
            const schoolClassrooms = await db.select().from(classrooms).where(eq(classrooms.schoolId, schoolId));
            return NextResponse.json(schoolClassrooms);
        }

        // Return classrooms where user is teacher or student
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (user.role === 'teacher') {
            const myClasses = await db.select().from(classrooms).where(eq(classrooms.teacherId, userId));
            return NextResponse.json(myClasses);
        }

        // If student, join with classroomStudents
        const myClasses = await db.select()
            .from(classrooms)
            .innerJoin(classroomStudents, eq(classrooms.id, classroomStudents.classroomId))
            .where(eq(classroomStudents.studentId, userId));

        return NextResponse.json(myClasses.map(c => c.classrooms));
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        return NextResponse.json({ error: 'Failed to fetch classrooms' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, schoolId, teacherId } = body;

        if (!name || !schoolId) {
            return NextResponse.json({ error: 'Name and School ID are required' }, { status: 400 });
        }

        const classroomId = `class_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        const [newClassroom] = await db.insert(classrooms).values({
            id: classroomId,
            name,
            schoolId,
            teacherId: teacherId || userId // Defaults to creator if they are a teacher
        }).returning();

        return NextResponse.json(newClassroom);
    } catch (error) {
        console.error('Error creating classroom:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
