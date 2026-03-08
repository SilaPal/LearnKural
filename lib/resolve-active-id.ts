import { NextRequest } from 'next/server';
import { verifySession } from './session';

/**
 * Resolves the correct target user/profile ID for progress-writing APIs.
 * If a child profile is active in the session, returns the child profile ID.
 * Otherwise, returns the parent's user ID.
 * This makes all progress APIs backwards-compatible with single-user accounts.
 */
export function resolveActiveId(request: NextRequest): { userId: string; activeProfileId: string | null } | null {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;

    // HMAC verification only
    const session = verifySession(sessionToken);
    if (!session?.userId) return null;

    return {
        userId: session.userId,
        activeProfileId: session.activeProfileId || null,
    };
}

/**
 * Returns the effective ID to use for reading/writing progress.
 * If a child profile is active, returns the child profile ID.
 * Otherwise returns the parent's user ID.
 */
export function getEffectiveId(request: NextRequest): string | null {
    const session = resolveActiveId(request);
    if (!session) return null;
    return session.activeProfileId || session.userId;
}
