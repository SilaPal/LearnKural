import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  
  if (host.includes('thirukural.replit.app')) {
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const targetUrl = `https://learnthirukkural.com${pathname}${search}`;
    
    return NextResponse.redirect(targetUrl, { status: 301 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
