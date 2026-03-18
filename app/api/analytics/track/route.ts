import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { pageViews } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

const BOT_PATTERNS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'sogou', 'exabot', 'facebot', 'ia_archiver',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot',
  'applebot', 'crawler', 'spider', 'bot/', 'headlesschrome',
  'lighthouse', 'chrome-lighthouse', 'pagespeed', 'gtmetrix',
];

const countryCache = new Map<string, { country: string; countryCode: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24;

async function getCountryFromIp(ip: string): Promise<{ country: string; countryCode: string }> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return { country: 'Local', countryCode: 'LO' };
  }

  const cached = countryCache.get(ip);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { country: cached.country, countryCode: cached.countryCode };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,status`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const result = { country: data.country || 'Unknown', countryCode: data.countryCode || '' };
        countryCache.set(ip, { ...result, ts: Date.now() });
        return result;
      }
    }
  } catch {
  }

  return { country: 'Unknown', countryCode: '' };
}

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get('user-agent') || '';
    const uaLower = ua.toLowerCase();
    if (BOT_PATTERNS.some((p) => uaLower.includes(p))) {
      return NextResponse.json({ ok: true });
    }

    const body = await request.json();
    const { page, visitorId, referrer } = body;

    if (!page || !visitorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '';

    const { country, countryCode } = await getCountryFromIp(ip);

    const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const existing = await db
      .select({ id: pageViews.id })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.visitorId, visitorId),
          gt(pageViews.createdAt, oneDayAgo)
        )
      )
      .limit(1);

    const isReturning = existing.length > 0;
    const id = `pv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.insert(pageViews).values({
      id,
      page: page.slice(0, 500),
      country,
      countryCode,
      visitorId,
      isReturning,
      referrer: (referrer || '').slice(0, 500),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Analytics track error:', err);
    return NextResponse.json({ ok: true });
  }
}
