import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { schoolInvites, users, classroomStudents } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { code, childProfileId } = body;

        if (!code) return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });

        const [invite] = await db.select().from(schoolInvites).where(eq(schoolInvites.code, code));
        if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

        if (new Date() > invite.expiresAt) {
            return NextResponse.json({ error: 'Invite code has expired' }, { status: 410 });
        }

        const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        // Update user: Assign school and role. If joining as student and childProfileId is present, we only assign parent role.
        let updatedRole: any = invite.role;
        if (invite.role === 'student' && childProfileId) {
            updatedRole = 'parent';
        }

        const updateData: any = {
            schoolId: invite.schoolId,
            role: updatedRole, // 'student', 'parent', or 'teacher'
            // Removing `tier: 'paid'` because this is now a B2C model (Parent Pays).
        };

        await db.update(users)
            .set(updateData)
            .where(eq(users.id, userId));

        // If it was a classroom-specific invite and user is a student, join classroom
        if (invite.classroomId && invite.role === 'student') {

            // If the user already belonged to a different school or different class, mark old active records as transferred/completed
            const isSwitchingSchools = currentUser?.schoolId && currentUser.schoolId !== invite.schoolId;

            // For safety and history, mark their previous active classroom enrollments as 'transferred'
            // We do this by dropping any existing active enrollments for this specific student/childProfile combination
            let historyQuery = db.update(classroomStudents)
                .set({ status: 'transferred' })
                .where(eq(classroomStudents.studentId, userId));

            if (childProfileId) {
                // If it's a specific child, only transfer that child's history, not siblings
                historyQuery = db.update(classroomStudents)
                    .set({ status: 'transferred' })
                    .where(eq(classroomStudents.childProfileId, childProfileId));
            }

            await historyQuery;

            const studentLinkObj: any = {
                id: 'cs_' + Math.random().toString(36).substring(2, 10),
                classroomId: invite.classroomId,
                studentId: userId,
                status: 'active'
            };
            if (childProfileId) {
                studentLinkObj.childProfileId = childProfileId;
            }

            await db.insert(classroomStudents).values(studentLinkObj).onConflictDoNothing();
        }

        return NextResponse.json({
            success: true,
            schoolId: invite.schoolId,
            role: invite.role
        });
    } catch (error) {
        console.error('Error joining school:', error);
        return NextResponse.json({ error: 'Failed to join school' }, { status: 500 });
    }
}
