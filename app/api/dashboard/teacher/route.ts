import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, classrooms, classroomStudents, childProfiles } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
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

        if (studentMappings.length === 0) {
            return NextResponse.json({ classrooms: myClassrooms, students: [] });
        }

        // 3. Collect kid profile IDs and direct student IDs
        const childProfileIds = studentMappings.map(m => m.childProfileId).filter(Boolean) as string[];
        const individualStudentIds = studentMappings.map(m => m.childProfileId ? null : m.studentId).filter(Boolean) as string[];

        let activeStudents: any[] = [];

        // 4a. Fetch child profiles
        if (childProfileIds.length > 0) {
            const children = await db.select().from(childProfiles).where(inArray(childProfiles.id, childProfileIds));
            children.forEach(child => {
                const mapping = studentMappings.find(m => m.childProfileId === child.id);
                activeStudents.push({
                    id: child.id,
                    name: child.nickname,
                    email: 'Child Profile', // Child profiles do not have emails
                    picture: null,          // Can map lottie avatars if needed later
                    classroomId: mapping?.classroomId,
                    progress: {
                        completedChapters: child.completedChapters
                    }
                });
            });
        }

        // 4b. Fetch adult/independent students (using the app directly, e.g. MVP1)
        if (individualStudentIds.length > 0) {
            const independentUsers = await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                picture: users.picture,
            }).from(users).where(inArray(users.id, individualStudentIds));

            // Optional: Fetch user_progress for adults here if needed, but assuming most are children right now
            independentUsers.forEach(u => {
                const mapping = studentMappings.find(m => m.studentId === u.id && !m.childProfileId);
                activeStudents.push({
                    ...u,
                    classroomId: mapping?.classroomId,
                    progress: { completedChapters: [] } // default for now, can join userProgress if needed
                });
            });
        }

        return NextResponse.json({
            classrooms: myClassrooms,
            students: activeStudents
        });
    } catch (error) {
        console.error('Teacher Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
