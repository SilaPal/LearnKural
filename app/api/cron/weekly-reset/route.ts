import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, childProfiles } from '@/db/schema';
import { sql, lt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/weekly-reset
 * 1. Resets weekly_xp to 0 for all users.
 * 2. Resets expired child profile avatars back to 'none'.
 * Called by GitHub Actions every Sunday at midnight UTC.
 * Protected by x-cron-secret header.
 */
export async function POST(request: NextRequest) {
    const secret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
        console.warn('[cron] Unauthorized weekly reset attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();

        // 1. Reset weekly XP
        await db.update(users).set({ weeklyXP: 0 });

        // 2. Reset expired child avatars back to 'none'
        await db.update(childProfiles)
            .set({ activeAvatarId: 'none', avatarExpiresAt: null })
            .where(lt(childProfiles.avatarExpiresAt, now));

        const resetAt = now.toISOString();
        console.log(`[cron] Weekly reset completed at ${resetAt}`);
        return NextResponse.json({ ok: true, resetAt });
    } catch (err) {
        console.error('[cron] Weekly reset failed:', err);
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
    }
}

/** GET for health check — can ping this to verify the endpoint is up */
export async function GET(request: NextRequest) {
    const secret = request.headers.get('x-cron-secret');
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, message: 'Weekly reset endpoint is healthy' });
}
