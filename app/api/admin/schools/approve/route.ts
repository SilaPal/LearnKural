import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { schools } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'anu.ganesan@gmail.com';

async function checkAdmin(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    const sessionData = verifySession(sessionToken);
    if (!sessionData?.userId) return null;

    const [user] = await db.select().from(require('@/db/schema').users).where(eq(require('@/db/schema').users.id, sessionData.userId));
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;

    return user;
}

export async function GET(request: NextRequest) {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const pendingSchools = await db.select()
            .from(schools)
            .where(eq(schools.isApproved, false));
        return NextResponse.json(pendingSchools);
    } catch (error) {
        console.error('Error fetching pending schools:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const admin = await checkAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { schoolId } = await request.json();
        if (!schoolId) return NextResponse.json({ error: 'School ID is required' }, { status: 400 });

        await db.update(schools)
            .set({ isApproved: true })
            .where(eq(schools.id, schoolId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error approving school:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
