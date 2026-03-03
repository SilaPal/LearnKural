import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, avatars, schools } from '@/db/schema';
import { desc, eq, or, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Tab = 'weekly' | 'alltime' | 'streak' | 'region';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tab = (searchParams.get('tab') ?? 'weekly') as Tab;
        const region = searchParams.get('region');

        // Determine sort column based on tab
        const orderCol =
            tab === 'streak' ? users.streak :
                tab === 'alltime' ? users.coins :
                    users.weeklyXP; // 'weekly' and 'region'

        const baseQuery = db.select({
            id: users.id,
            name: users.name,
            picture: users.picture,
            coins: users.coins,
            weeklyXP: users.weeklyXP,
            streak: users.streak,
            longestStreak: users.longestStreak,
            activeAvatarId: users.activeAvatarId,
            avatarImageUrl: avatars.imageUrl,
            region: users.region,
            tier: users.tier,
            schoolName: schools.name,
        })
            .from(users)
            .leftJoin(avatars, eq(users.activeAvatarId, avatars.id))
            .leftJoin(schools, eq(users.schoolId, schools.id))
            .orderBy(desc(orderCol), desc(users.coins), desc(users.createdAt))
            .limit(50);

        const baseCondition = or(
            eq(users.tier, 'paid'),
            sql`${users.createdAt} > NOW() - INTERVAL '30 days'`
        );

        let leaderboard;
        if (region && region !== 'Global') {
            leaderboard = await baseQuery.where(and(baseCondition, eq(users.region, region)));
        } else {
            leaderboard = await baseQuery.where(baseCondition);
        }

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
