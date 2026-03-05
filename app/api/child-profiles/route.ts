import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { avatars, childProfiles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolveActiveId } from '@/lib/resolve-active-id';

export const dynamic = 'force-dynamic';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
    const session = resolveActiveId(request);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await db
        .select({
            id: childProfiles.id,
            nickname: childProfiles.nickname,
            activeAvatarId: childProfiles.activeAvatarId,
            avatarThumbnail: avatars.thumbnailUrl,
            avatarExpiresAt: childProfiles.avatarExpiresAt,
            coins: childProfiles.coins,
            badges: childProfiles.badges,
            region: childProfiles.region,
        })
        .from(childProfiles)
        .leftJoin(avatars, eq(childProfiles.activeAvatarId, avatars.id))
        .where(eq(childProfiles.parentUserId, session.userId));

    // Inline expiry check: if avatarExpiresAt has passed, treat as 'none'
    const now = new Date();
    const resolved = profiles.map(p => ({
        ...p,
        activeAvatarId: (p.avatarExpiresAt && p.avatarExpiresAt < now) ? 'none' : p.activeAvatarId,
        avatarThumbnail: (p.avatarExpiresAt && p.avatarExpiresAt < now) ? null : p.avatarThumbnail,
    }));

    return NextResponse.json({ profiles: resolved });
}

export async function POST(request: NextRequest) {
    const session = resolveActiveId(request);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { nickname } = await request.json();
    if (!nickname?.trim()) return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });

    // Inherit region from parent
    const [parent] = await db.select({ region: users.region }).from(users).where(eq(users.id, session.userId));
    const parentRegion = parent?.region || 'Global';

    const id = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // New child profiles start with no avatar — they pick one from Sandhai
    const [profile] = await db.insert(childProfiles).values({
        id,
        parentUserId: session.userId,
        nickname: nickname.trim(),
        activeAvatarId: 'none',
        region: parentRegion,
    }).returning();

    return NextResponse.json({ profile });
}

export async function DELETE(request: NextRequest) {
    const session = resolveActiveId(request);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('id');
    if (!profileId) return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });

    const [profile] = await db.select().from(childProfiles).where(eq(childProfiles.id, profileId));
    if (!profile || profile.parentUserId !== session.userId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.delete(childProfiles).where(eq(childProfiles.id, profileId));
    return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
    const session = resolveActiveId(request);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId, avatarId } = await request.json();
    if (!profileId) return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });

    const [profile] = await db.select().from(childProfiles).where(eq(childProfiles.id, profileId));
    if (!profile || profile.parentUserId !== session.userId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (avatarId !== undefined) {
        // Check parent tier to decide expiry
        const [parent] = await db.select({ tier: users.tier }).from(users).where(eq(users.id, session.userId));
        const isPremium = parent?.tier === 'paid';
        const avatarExpiresAt = isPremium ? null : new Date(Date.now() + THIRTY_DAYS_MS);

        await db.update(childProfiles)
            .set({ activeAvatarId: avatarId, avatarExpiresAt })
            .where(eq(childProfiles.id, profileId));
    }

    return NextResponse.json({ success: true, avatarId });
}
