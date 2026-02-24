import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, classrooms, classroomStudents, userProgress } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

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

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user || (user.role !== 'teacher' && user.role !== 'school_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get teacher's classrooms
        const myClassrooms = await db.select().from(classrooms).where(eq(classrooms.teacherId, userId));

        if (myClassrooms.length === 0) {
            return NextResponse.json({ classrooms: [], students: [] });
        }

        const classroomIds = myClassrooms.map(c => c.id);

        // 2. Get students in those classrooms
        const studentMappings = await db.select()
            .from(classroomStudents)
            .where(inArray(classroomStudents.classroomId, classroomIds));

        const studentIds = studentMappings.map(m => m.studentId);

        let studentsWithProgress = [];
        if (studentIds.length > 0) {
            // 3. Get student details and progress
            const studentDetails = await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                picture: users.picture,
            }).from(users).where(inArray(users.id, studentIds));

            const studentProgressData = await db.select().from(userProgress).where(inArray(userProgress.userId, studentIds));

            studentsWithProgress = studentDetails.map(s => {
                const progress = studentProgressData.find(p => p.userId === s.id);
                const mapping = studentMappings.find(m => m.studentId === s.id);
                return {
                    ...s,
                    classroomId: mapping?.classroomId,
                    progress: progress || { completedChapters: [] }
                };
            });
        }

        return NextResponse.json({
            classrooms: myClassrooms,
            students: studentsWithProgress
        });
    } catch (error) {
        console.error('Teacher Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
