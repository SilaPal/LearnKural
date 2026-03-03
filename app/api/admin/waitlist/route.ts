import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, waitlist } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const ADMIN_EMAIL = 'anu.ganesan@gmail.com';

async function getAuthenticatedUser(request: NextRequest) {
    const session = request.cookies.get('thirukural-session')?.value;
    if (!session) return null;
    try {
        const { userId } = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        return user || null;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const user = await getAuthenticatedUser(request);

    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Get all waitlist entries, joined with users table to get names if they signed up
        const list = await db.select({
            email: waitlist.email,
            createdAt: waitlist.createdAt,
            userName: users.name,
            userTier: users.tier,
        })
            .from(waitlist)
            .leftJoin(users, eq(users.email, waitlist.email))
            .orderBy(desc(waitlist.createdAt));

        return NextResponse.json(list);
    } catch (e) {
        console.error('Failed to fetch waitlist:', e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
