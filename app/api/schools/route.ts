import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { schools, users } from '@/db/schema';
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
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const allSchools = await db.select().from(schools);
        return NextResponse.json(allSchools);
    } catch (error) {
        console.error('Error fetching schools:', error);
        return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, logo, banner } = body;

        if (!name) {
            return NextResponse.json({ error: 'School name is required' }, { status: 400 });
        }

        const schoolId = `school_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const [newSchool] = await db.insert(schools).values({
            id: schoolId,
            name,
            logo: logo || null,
            banner: banner || null,
            subscriptionStatus: 'active'
        }).returning();

        // Update the user who created it to be the school_admin
        await db.update(users)
            .set({
                role: 'school_admin',
                schoolId: schoolId,
                tier: 'paid' // School admins get premium features
            })
            .where(eq(users.id, userId));

        return NextResponse.json(newSchool);
    } catch (error) {
        console.error('Error creating school:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
