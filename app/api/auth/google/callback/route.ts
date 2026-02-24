import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '';
    const error = searchParams.get('error');

    const callbackUrl = process.env.GOOGLE_CALLBACK_URL ||
        `${request.nextUrl.origin}/api/auth/google/callback`;
    const origin = request.nextUrl.origin;

    if (error || !code) {
        return NextResponse.redirect(`${origin}/?auth_error=cancelled`);
    }

    try {
        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: callbackUrl,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenRes.ok) {
            console.error('Token exchange failed:', await tokenRes.text());
            return NextResponse.redirect(`${origin}/?auth_error=token_exchange`);
        }

        const tokens = await tokenRes.json();

        // Get user profile from Google
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!profileRes.ok) {
            return NextResponse.redirect(`${origin}/?auth_error=profile_fetch`);
        }

        const profile = await profileRes.json();
        const email: string = profile.email?.toLowerCase().trim();
        if (!email) {
            return NextResponse.redirect(`${origin}/?auth_error=no_email`);
        }

        // Parse state to detect login vs sign-up mode and redirect path
        let isLoginMode = false;
        let redirectTo = '/';
        try {
            if (state) {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
                if (decoded.isLoginMode) isLoginMode = true;
                if (decoded.redirectTo && typeof decoded.redirectTo === 'string' && decoded.redirectTo.startsWith('/')) {
                    redirectTo = decoded.redirectTo;
                }
            }
        } catch (e) {
            console.error('Failed to parse state:', e);
        }
        // Look up or create user
        let [user] = await db.select().from(users).where(eq(users.email, email));

        if (!user) {
            // New user registration
            if (isLoginMode) {
                // If they clicked "Login" but don't exist, we can either auto-create or reject. Let's auto-create.
            }
            const newId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            [user] = await db.insert(users).values({
                id: newId,
                email,
                name: profile.name || email.split('@')[0],
                googleId: profile.id,
                picture: profile.picture || null,
                tier: 'free',
            }).returning();
        } else {
            // Update profile picture if missing
            if (!user.picture && profile.picture) {
                [user] = await db.update(users)
                    .set({ picture: profile.picture })
                    .where(eq(users.id, user.id))
                    .returning();
            }
        }

        // Set session cookie (simple signed JSON for now — swap for iron-session/JWT in production)
        const sessionData = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
        const finalRedirectUrl = `${origin}${redirectTo}`;
        console.log(`[AUTH] /api/auth/google/callback - Created session for ${user.id}, redirecting back to: ${finalRedirectUrl}`);
        const response = NextResponse.redirect(finalRedirectUrl);
        response.cookies.set('thirukural-session', sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        return response;
    } catch (err) {
        console.error('[Auth Callback Error]', err);
        return NextResponse.redirect(`${origin}/?auth_error=server_error`);
    }
}
