import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, avatars } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const region = searchParams.get('region');

        const query = db.select({
            id: users.id,
            name: users.name,
            picture: users.picture,
            coins: users.coins,
            activeAvatarId: users.activeAvatarId,
            avatarImageUrl: avatars.imageUrl,
            region: users.region
        })
            .from(users)
            .leftJoin(avatars, eq(users.activeAvatarId, avatars.id))
            .orderBy(desc(users.coins))
            .limit(100);

        if (region && region !== 'Global') {
            const leaderboard = await query.where(eq(users.region, region));
            return NextResponse.json(leaderboard);
        }

        const leaderboard = await query;
        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
