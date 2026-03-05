import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { schools, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const schoolId = params.id;

    try {
        // Verify user has permission to edit this school
        // Must be super_admin OR school_admin for THIS school
        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const isSuperAdmin = user.role === 'super_admin';
        const isSchoolAdminForThisSchool = user.role === 'school_admin' && user.schoolId === schoolId;

        if (!isSuperAdmin && !isSchoolAdminForThisSchool) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, logo, banner } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (logo !== undefined) updateData.logo = logo;
        if (banner !== undefined) updateData.banner = banner;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No data to update' }, { status: 400 });
        }

        const [updatedSchool] = await db.update(schools)
            .set(updateData)
            .where(eq(schools.id, schoolId))
            .returning();

        if (!updatedSchool) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        return NextResponse.json(updatedSchool);
    } catch (error) {
        console.error('Error updating school:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
