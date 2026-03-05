import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, schools, classrooms } from '@/db/schema';
import { eq, count, sql, and } from 'drizzle-orm';
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
    } catch { }

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const querySchoolId = searchParams.get('schoolId');

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Determine which schoolId to use
        let schoolId = user.schoolId;
        if (user.role === 'super_admin' && querySchoolId) {
            schoolId = querySchoolId;
        }

        if (!schoolId) {
            return NextResponse.json({ error: 'No school associated with this user' }, { status: 400 });
        }

        // Verify permissions: Must be admin of this school OR super_admin
        const isSuperAdmin = user.role === 'super_admin';
        const isSchoolAdmin = user.role === 'school_admin' && user.schoolId === schoolId;

        if (!isSuperAdmin && !isSchoolAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. School Info
        const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

        // 2. Stats
        const [studentCountResult] = await db.select({ value: count() }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.role, 'student')));
        const [classroomCountResult] = await db.select({ value: count() }).from(classrooms).where(eq(classrooms.schoolId, schoolId));

        // 3. Classrooms List
        const schoolClassrooms = await db.select().from(classrooms).where(eq(classrooms.schoolId, schoolId));

        // 4. Staff List (school_admin or teacher)
        const staff = await db.select()
            .from(users)
            .where(and(eq(users.schoolId, schoolId), sql`${users.role} IN ('school_admin', 'teacher')`))
            .orderBy(sql`${users.createdAt} DESC`);

        // 5. Recent Students
        const recentStudents = await db.select()
            .from(users)
            .where(and(eq(users.schoolId, schoolId), eq(users.role, 'student')))
            .orderBy(sql`${users.createdAt} DESC`)
            .limit(10);

        return NextResponse.json({
            school,
            stats: {
                students: studentCountResult.value,
                classrooms: classroomCountResult.value,
                staff: staff.length
            },
            classrooms: schoolClassrooms,
            staff,
            recentUsers: recentStudents
        });
    } catch (error) {
        console.error('School Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
