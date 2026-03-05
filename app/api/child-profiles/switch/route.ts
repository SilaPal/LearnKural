import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { childProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolveActiveId } from '@/lib/resolve-active-id';
import { signSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const session = resolveActiveId(request);
        if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { profileId } = await request.json();
        console.log(`[ProfileSwitch] Switching user ${session.userId} to profile ${profileId}`);

        // profileId: null or 'parent' = switch back to parent session
        if (!profileId || profileId === 'parent') {
            const newToken = signSession({ userId: session.userId });
            const res = NextResponse.json({ success: true, activeProfileId: null });
            res.cookies.set('thirukural-session', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            });
            return res;
        }

        // Verify the profile belongs to this parent
        const [profile] = await db.select().from(childProfiles).where(eq(childProfiles.id, profileId));
        if (!profile) {
            console.error(`[ProfileSwitch] Profile ${profileId} not found`);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
        if (profile.parentUserId !== session.userId) {
            console.error(`[ProfileSwitch] Profile ${profileId} does not belong to user ${session.userId}`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newToken = signSession({ userId: session.userId, activeProfileId: profileId });
        const res = NextResponse.json({ success: true, activeProfileId: profileId, nickname: profile.nickname });
        res.cookies.set('thirukural-session', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        });
        return res;
    } catch (err) {
        console.error('[ProfileSwitch] Error switching profile:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
