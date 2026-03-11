import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { schoolInvites, schools, classrooms } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    const code = params.code;

    if (!code) {
        return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    try {
        const [invite] = await db
            .select({
                code: schoolInvites.code,
                schoolId: schoolInvites.schoolId,
                classroomId: schoolInvites.classroomId,
                role: schoolInvites.role,
                expiresAt: schoolInvites.expiresAt,
                schoolName: schools.name,
                classroomName: classrooms.name,
            })
            .from(schoolInvites)
            .leftJoin(schools, eq(schoolInvites.schoolId, schools.id))
            .leftJoin(classrooms, eq(schoolInvites.classroomId, classrooms.id))
            .where(eq(schoolInvites.code, code))
            .limit(1);

        if (!invite) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
        }

        const now = new Date();
        if (invite.expiresAt < now) {
            return NextResponse.json({ error: 'Invite code has expired' }, { status: 410 });
        }

        return NextResponse.json({
            schoolId: invite.schoolId,
            schoolName: invite.schoolName,
            classroomId: invite.classroomId,
            classroomName: invite.classroomName,
            role: invite.role,
        });
    } catch (error) {
        console.error('Error fetching invite:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
