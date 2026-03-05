import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, childProfiles, avatars, schools } from '@/db/schema';
import { desc, eq, or, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Tab = 'weekly' | 'alltime' | 'streak' | 'region';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tab = (searchParams.get('tab') ?? 'weekly') as Tab;
        const region = searchParams.get('region');

        // Column mapping for union query
        const xpCol = tab === 'streak' ? 'streak' : tab === 'alltime' ? 'coins' : 'weekly_xp';

        // Construct the union query as raw SQL to handle joining with different tables easily
        const regionFilter = region && region !== 'Global' ? sql`AND u.region = ${region}` : sql``;
        const regionFilterChild = region && region !== 'Global' ? sql`AND COALESCE(cp.region, u.region, 'Global') = ${region}` : sql``;

        // Note: school join is only relevant for users table currently, as classrooms link to users (teachers)
        // However, child_profiles inherit school from their parent indirectly? 
        // For now, let's just make the union robust.

        const query = sql`
            (
                SELECT 
                    u.id as id, 
                    u.name as name, 
                    u.picture as picture, 
                    u.coins as coins, 
                    u.weekly_xp as weekly_xp, 
                    u.streak as streak, 
                    u.longest_streak as longest_streak,
                    u.active_avatar_id as active_avatar_id,
                    a.image_url as avatar_image_url,
                    a.thumbnail_url as avatar_thumbnail_url,
                    u.region as region,
                    u.tier as tier,
                    u.created_at as created_at,
                    s.name as school_name
                FROM ${users} u
                LEFT JOIN ${avatars} a ON u.active_avatar_id = a.id
                LEFT JOIN ${schools} s ON u.school_id = s.id
                WHERE (u.tier = 'paid' OR u.created_at > NOW() - INTERVAL '30 days')
                ${regionFilter}
            )
            UNION ALL
            (
                SELECT 
                    cp.id as id, 
                    cp.nickname as name, 
                    NULL as picture, 
                    cp.coins as coins, 
                    cp.weekly_xp as weekly_xp, 
                    cp.streak as streak, 
                    cp.longest_streak as longest_streak, 
                    cp.active_avatar_id as active_avatar_id,
                    a.image_url as avatar_image_url,
                    a.thumbnail_url as avatar_thumbnail_url,
                    COALESCE(cp.region, u.region, 'Global') as region,
                    'free' as tier,
                    cp.created_at as created_at,
                    NULL as school_name
                FROM ${childProfiles} cp
                LEFT JOIN ${users} u ON cp.parent_user_id = u.id
                LEFT JOIN ${avatars} a ON cp.active_avatar_id = a.id
                WHERE cp.created_at > NOW() - INTERVAL '30 days'
                ${regionFilterChild}
            )
            ORDER BY ${sql.raw(xpCol)} DESC, coins DESC, created_at DESC
            LIMIT 50
        `;

        const leaderboard = await db.execute(query) as any;
        const resultRows = leaderboard.rows || (Array.isArray(leaderboard) ? leaderboard : []);

        // Convert the raw result to the camelCase format expected by the frontend
        const rows = resultRows.map((r: any) => ({
            id: r.id,
            name: r.name,
            picture: r.picture,
            coins: r.coins,
            weeklyXP: r.weekly_xp,
            streak: r.streak,
            longestStreak: r.longest_streak,
            activeAvatarId: r.active_avatar_id,
            avatarImageUrl: r.avatar_image_url,
            avatarThumbnailUrl: r.avatar_thumbnail_url,
            region: r.region,
            tier: r.tier,
            schoolName: r.school_name
        }));

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}

