import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq, and, sql, desc, or, ilike } from 'drizzle-orm';
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

export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const querySchoolId = searchParams.get('schoolId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let schoolId = user.schoolId;
        if (user.role === 'super_admin' && querySchoolId) {
            schoolId = querySchoolId;
        }

        if (!schoolId) {
            return NextResponse.json({ error: 'No school associated with this user' }, { status: 400 });
        }

        const isSuperAdmin = user.role === 'super_admin';
        const isSchoolAdmin = user.role === 'school_admin' && user.schoolId === schoolId;
        if (!isSuperAdmin && !isSchoolAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const offset = (page - 1) * limit;

        // Base conditions: must be in this school and a student
        const conditions = [
            eq(users.schoolId, schoolId),
            eq(users.role, 'student')
        ];

        // Apply search filter if provided
        if (search) {
            conditions.push(
                or(
                    ilike(users.name, `%${search}%`),
                    ilike(users.email, `%${search}%`)
                ) as any
            );
        }

        const whereClause = and(...conditions);

        // Fetch students and total count
        const [students, [{ totalCount }]] = await Promise.all([
            db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                picture: users.picture,
                tier: users.tier,
                createdAt: users.createdAt,
                region: users.region
            })
                .from(users)
                .where(whereClause)
                .orderBy(desc(users.createdAt))
                .limit(limit)
                .offset(offset),
            db.select({ totalCount: sql<number>`cast(count(${users.id}) as int)` })
                .from(users)
                .where(whereClause)
        ]);

        return NextResponse.json({
            students,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('School Dashboard Students API error:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}
