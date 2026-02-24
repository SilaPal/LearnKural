import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, schools, classrooms, userProgress, classroomStudents } from '@/db/schema';
import { eq, count, sql } from 'drizzle-orm';

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
        if (!user || user.role !== 'school_admin' || !user.schoolId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const schoolId = user.schoolId;

        // 1. School Info
        const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));

        // 2. Stats
        const [studentCountResult] = await db.select({ value: count() }).from(users).where(eq(users.schoolId, schoolId));
        const [classroomCountResult] = await db.select({ value: count() }).from(classrooms).where(eq(classrooms.schoolId, schoolId));

        // 3. Classrooms List
        const schoolClassrooms = await db.select().from(classrooms).where(eq(classrooms.schoolId, schoolId));

        // 4. Recent Joins (Users in this school)
        const recentUsers = await db.select()
            .from(users)
            .where(eq(users.schoolId, schoolId))
            .orderBy(sql`${users.createdAt} DESC`)
            .limit(10);

        return NextResponse.json({
            school,
            stats: {
                students: studentCountResult.value,
                classrooms: classroomCountResult.value,
            },
            classrooms: schoolClassrooms,
            recentUsers
        });
    } catch (error) {
        console.error('School Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
