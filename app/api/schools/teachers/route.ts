import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, schools } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { email, schoolId } = body;

        if (!email || !schoolId) {
            return NextResponse.json({ error: 'Email and School ID are required' }, { status: 400 });
        }

        // 1. Verify permissions: User must be super_admin or school_admin of this school
        const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const isSuperAdmin = currentUser.role === 'super_admin';
        const isSchoolAdmin = currentUser.role === 'school_admin' && currentUser.schoolId === schoolId;

        if (!isSuperAdmin && !isSchoolAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Find the teacher candidate
        const [candidate] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
        if (!candidate) {
            return NextResponse.json({ error: 'User with this email not found in the system. They must sign up first.' }, { status: 404 });
        }

        // 3. Update the candidate's role and schoolId
        // We only upgrade roles to 'teacher' if they are currently 'student' or 'parent'.
        // If they are already a school_admin or super_admin, we leave the role but set the schoolId (if not super_admin).
        const updateData: any = { schoolId };
        if (candidate.role === 'student' || candidate.role === 'parent') {
            updateData.role = 'teacher';
        }

        // Ensure they have 'paid' tier since they are now part of a school
        updateData.tier = 'paid';

        const [updatedUser] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, candidate.id))
            .returning();

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error('Error adding teacher:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
