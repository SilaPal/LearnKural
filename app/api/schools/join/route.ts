import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { schoolInvites, users, classroomStudents } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { code } = body;

        if (!code) return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });

        const [invite] = await db.select().from(schoolInvites).where(eq(schoolInvites.code, code));
        if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

        if (new Date() > invite.expiresAt) {
            return NextResponse.json({ error: 'Invite code has expired' }, { status: 410 });
        }

        // Update user: Assign school and role
        await db.update(users)
            .set({
                schoolId: invite.schoolId,
                role: invite.role, // 'student' or 'teacher'
                tier: 'paid' // Joining a school grants premium access
            })
            .where(eq(users.id, userId));

        // If it was a classroom-specific invite and user is a student, join classroom
        if (invite.classroomId && invite.role === 'student') {
            await db.insert(classroomStudents).values({
                classroomId: invite.classroomId,
                studentId: userId
            }).onConflictDoNothing();
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
