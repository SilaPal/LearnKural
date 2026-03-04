import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(request: NextRequest) {
    const session = request.cookies.get('thirukural-session')?.value;
    console.log('[AUTH] /api/auth/user - Cookie received:', session ? 'Yes' : 'No');
    if (!session) return null;

    try {
        const parsed = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
        console.log('[AUTH] /api/auth/user - Parsed userId:', parsed.userId);
        const [user] = await db.select().from(users).where(eq(users.id, parsed.userId));
        console.log('[AUTH] /api/auth/user - User found in store:', user ? 'Yes' : 'No');
        return user || null;
    } catch (e) {
        console.error('[AUTH] /api/auth/user - Error parsing session:', e);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json(null, { status: 401 });

    // Never expose googleId to the client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { googleId, ...safeUser } = user;
    return NextResponse.json(safeUser);
}
