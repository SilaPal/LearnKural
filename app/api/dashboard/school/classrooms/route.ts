import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { classrooms, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    try {
        if (!sessionToken.includes('.')) {
            const dec = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
            return dec.userId || null;
        }
    } catch { }

    const sessionData = await verifySession(sessionToken);
    return sessionData?.userId || null;
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user || (user.role !== 'school_admin' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const { name, startDate, endDate } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Classroom name is required' }, { status: 400 });
        }

        const schoolId = user.schoolId;
        if (!schoolId) {
            return NextResponse.json({ error: 'No school associated with this user' }, { status: 400 });
        }

        const newClassroomId = 'cls_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        // Parse dates safely
        let parsedStartDate = null;
        let parsedEndDate = null;

        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) parsedStartDate = null;
        }

        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) parsedEndDate = null;
        }

        await db.insert(classrooms).values({
            id: newClassroomId,
            schoolId,
            name: name,
            startDate: parsedStartDate,
            endDate: parsedEndDate
        });

        return NextResponse.json({ success: true, classroomId: newClassroomId });

    } catch (error) {
        console.error('Error creating classroom:', error);
        return NextResponse.json({ error: 'Failed to create classroom' }, { status: 500 });
    }
}
