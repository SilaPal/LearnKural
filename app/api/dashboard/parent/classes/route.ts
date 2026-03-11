import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { childProfiles, classroomStudents, classrooms, schools, users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { resolveActiveId } from '@/lib/resolve-active-id';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const session = resolveActiveId(request);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Fetch child profiles for the parent
        const myProfiles = await db.select({
            id: childProfiles.id,
            nickname: childProfiles.nickname,
        }).from(childProfiles)
            .where(eq(childProfiles.parentUserId, session.userId));

        const profileIds = myProfiles.map(p => p.id);

        // Fetch enrollments that belong to either the parent (as student) OR any of their child profiles
        const allEnrollments = await db.select({
            id: classroomStudents.id,
            status: classroomStudents.status,
            joinedAt: classroomStudents.joinedAt,
            childProfileId: classroomStudents.childProfileId,
            classroomName: classrooms.name,
            classroomId: classrooms.id,
            schoolName: schools.name,
            schoolLogo: schools.logo,
            endDate: classrooms.endDate,
            teacherName: users.name,
        })
            .from(classroomStudents)
            .innerJoin(classrooms, eq(classroomStudents.classroomId, classrooms.id))
            .innerJoin(schools, eq(classrooms.schoolId, schools.id))
            .leftJoin(users, eq(classrooms.teacherId, users.id))
            .where(
                or(
                    eq(classroomStudents.studentId, session.userId),
                    ...(profileIds.length > 0 ? profileIds.map(pid => eq(classroomStudents.childProfileId, pid)) : [])
                )
            );

        return NextResponse.json({
            enrollments: allEnrollments,
            profiles: myProfiles
        });
    } catch (error) {
        console.error('Parent Classes API error:', error);
        return NextResponse.json({ error: 'Failed to fetch class data' }, { status: 500 });
    }
}
