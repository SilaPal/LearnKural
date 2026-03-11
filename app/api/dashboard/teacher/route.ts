import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, classrooms, classroomStudents, childProfiles, userProgress, avatars, schools } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        const isAdminEmail = user?.email?.toLowerCase() === 'anu.ganesan@gmail.com';

        if (!user || (user.role !== 'teacher' && user.role !== 'school_admin' && user.role !== 'super_admin' && !isAdminEmail)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get classrooms
        let myClassrooms = [];
        const isActuallyAdmin = user.role === 'school_admin' || user.role === 'super_admin' || isAdminEmail;

        if (isActuallyAdmin && user.schoolId) {
            // Admins see all classrooms in the school
            myClassrooms = await db.select().from(classrooms).where(eq(classrooms.schoolId, user.schoolId));
        } else {
            // Teachers only see their own classrooms
            myClassrooms = await db.select().from(classrooms).where(eq(classrooms.teacherId, userId));
        }

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

        // 4a. Fetch child profiles with avatar info
        if (childProfileIds.length > 0) {
            const children = await db.select({
                id: childProfiles.id,
                nickname: childProfiles.nickname,
                activeAvatarId: childProfiles.activeAvatarId,
                avatarThumbnail: avatars.thumbnailUrl,
                avatarExpiresAt: childProfiles.avatarExpiresAt,
                coins: childProfiles.coins,
                badges: childProfiles.badges,
                streak: childProfiles.streak,
                completedChapters: childProfiles.completedChapters,
                region: childProfiles.region,
            })
                .from(childProfiles)
                .leftJoin(avatars, eq(childProfiles.activeAvatarId, avatars.id))
                .where(inArray(childProfiles.id, childProfileIds));

            const now = new Date();
            children.forEach(child => {
                const mapping = studentMappings.find(m => m.childProfileId === child.id);
                // Expiry check
                const thumb = (child.avatarExpiresAt && child.avatarExpiresAt < now) ? null : child.avatarThumbnail;

                activeStudents.push({
                    id: child.id,
                    name: child.nickname,
                    email: 'Student',
                    picture: thumb,
                    classroomId: mapping?.classroomId,
                    isChild: true,
                    progress: {
                        completedChapters: child.completedChapters,
                        coins: child.coins,
                        streak: child.streak,
                        badges: (child.badges as any[])?.length || 0,
                        region: child.region
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
                coins: users.coins,
                streak: users.streak,
                region: users.region
            }).from(users).where(inArray(users.id, individualStudentIds));

            // Fetch user_progress for adults
            const progressList = await db.select().from(userProgress).where(inArray(userProgress.userId, individualStudentIds));

            independentUsers.forEach(u => {
                const mapping = studentMappings.find(m => m.studentId === u.id && !m.childProfileId);
                const p = progressList.find(pl => pl.userId === u.id);
                activeStudents.push({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    picture: u.picture,
                    classroomId: mapping?.classroomId,
                    isChild: false,
                    progress: {
                        completedChapters: p?.completedChapters || [],
                        coins: u.coins,
                        streak: u.streak,
                        badges: (p?.badges as any[])?.length || 0,
                        region: u.region
                    }
                });
            });
        }

        // Get School info if schoolId exists
        let schoolName: string | null = null;
        if (user.schoolId) {
            const [school] = await db.select({ name: schools.name })
                .from(schools)
                .where(eq(schools.id, user.schoolId))
                .limit(1);
            schoolName = school?.name || null;
        }

        return NextResponse.json({
            schoolName,
            classrooms: myClassrooms,
            students: activeStudents
        });
    } catch (error) {
        console.error('Teacher Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
