import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { schoolInvites, schools, classrooms } from '@/db/schema';
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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });

    try {
        const [invite] = await db.select().from(schoolInvites).where(eq(schoolInvites.code, code));

        if (!invite) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
        }

        if (new Date() > invite.expiresAt) {
            return NextResponse.json({ error: 'Invite code has expired' }, { status: 410 });
        }

        const [school] = await db.select().from(schools).where(eq(schools.id, invite.schoolId));
        let classroom = null;
        if (invite.classroomId) {
            [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, invite.classroomId));
        }

        return NextResponse.json({
            invite,
            school,
            classroom
        });
    } catch (error) {
        console.error('Invite validation error:', error);
        return NextResponse.json({ error: 'Failed to validate invite' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { schoolId, classroomId, role } = body;

        if (!schoolId) return NextResponse.json({ error: 'School ID is required' }, { status: 400 });

        // Generate a 6-character alphanumeric code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const [newInvite] = await db.insert(schoolInvites).values({
            code,
            schoolId,
            classroomId: classroomId || null,
            role: role || 'student',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
        }).returning();

        return NextResponse.json(newInvite);
    } catch (error) {
        console.error('Error creating invite:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
