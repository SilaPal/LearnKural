import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, userProgress, schools } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

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
        // 1. Get children
        const children = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            picture: users.picture,
            schoolId: users.schoolId,
            coins: users.coins,
            activeAvatarId: users.activeAvatarId
        }).from(users).where(eq(users.parentId, userId));

        if (children.length === 0) {
            return NextResponse.json({ children: [] });
        }

        const childIds = children.map(c => c.id);

        // 2. Get progress
        const progressData = await db.select().from(userProgress).where(inArray(userProgress.userId, childIds));

        // 3. Get school info for children
        const schoolIds = children.map(c => c.schoolId).filter(Boolean) as string[];
        let schoolsList = [];
        if (schoolIds.length > 0) {
            schoolsList = await db.select().from(schools).where(inArray(schools.id, schoolIds));
        }

        const childrenWithData = children.map(child => {
            const progress = progressData.find(p => p.userId === child.id);
            const school = schoolsList.find(s => s.id === child.schoolId);
            return {
                ...child,
                school,
                progress: progress || { completedChapters: [], badges: [] }
            };
        });

        return NextResponse.json({ children: childrenWithData });
    } catch (error) {
        console.error('Parent Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch parent dashboard data' }, { status: 500 });
    }
}
