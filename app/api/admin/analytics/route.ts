import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, pageViews } from '@/db/schema';
import { eq, desc, gte, sql, count, countDistinct } from 'drizzle-orm';
import { verifySession } from '@/lib/session';

const ADMIN_EMAIL = 'anu.ganesan@gmail.com';

async function getAuthenticatedUser(request: NextRequest) {
  const session = request.cookies.get('thirukural-session')?.value;
  if (!session) return null;
  try {
    const payload = verifySession(session);
    if (!payload?.userId) return null;
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    return user || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== 'super_admin' && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalViews, uniqueToday, uniqueWeek, uniqueMonth, topPages, topCountries, dailyTrend, newVsReturning] =
    await Promise.all([
      db.select({ count: count() }).from(pageViews),

      db
        .select({ count: countDistinct(pageViews.visitorId) })
        .from(pageViews)
        .where(gte(pageViews.createdAt, today)),

      db
        .select({ count: countDistinct(pageViews.visitorId) })
        .from(pageViews)
        .where(gte(pageViews.createdAt, weekAgo)),

      db
        .select({ count: countDistinct(pageViews.visitorId) })
        .from(pageViews)
        .where(gte(pageViews.createdAt, monthAgo)),

      db
        .select({
          page: pageViews.page,
          views: count(),
          uniqueVisitors: countDistinct(pageViews.visitorId),
        })
        .from(pageViews)
        .where(gte(pageViews.createdAt, monthAgo))
        .groupBy(pageViews.page)
        .orderBy(desc(count()))
        .limit(20),

      db
        .select({
          country: pageViews.country,
          countryCode: pageViews.countryCode,
          views: count(),
          uniqueVisitors: countDistinct(pageViews.visitorId),
        })
        .from(pageViews)
        .where(gte(pageViews.createdAt, monthAgo))
        .groupBy(pageViews.country, pageViews.countryCode)
        .orderBy(desc(count()))
        .limit(20),

      db
        .select({
          day: sql<string>`DATE(${pageViews.createdAt})`.as('day'),
          views: count(),
          uniqueVisitors: countDistinct(pageViews.visitorId),
        })
        .from(pageViews)
        .where(gte(pageViews.createdAt, weekAgo))
        .groupBy(sql`DATE(${pageViews.createdAt})`)
        .orderBy(sql`DATE(${pageViews.createdAt})`),

      db
        .select({
          isReturning: pageViews.isReturning,
          count: count(),
        })
        .from(pageViews)
        .where(gte(pageViews.createdAt, monthAgo))
        .groupBy(pageViews.isReturning),
    ]);

  return NextResponse.json({
    summary: {
      totalViews: totalViews[0]?.count || 0,
      uniqueToday: uniqueToday[0]?.count || 0,
      uniqueWeek: uniqueWeek[0]?.count || 0,
      uniqueMonth: uniqueMonth[0]?.count || 0,
    },
    topPages,
    topCountries,
    dailyTrend,
    newVsReturning,
  });
}
