import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, waitlist } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function getUserId(request: NextRequest) {
    const session = request.cookies.get('thirukural-session')?.value;
    if (!session) return null;
    try {
        const { userId } = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
        return userId;
    } catch {
        return null;
    }
}
/**
 * POST /api/payments/checkout
 * Creates a Stripe Checkout session (stub — wire in Stripe when credentials are ready).
 */
export async function POST(request: NextRequest) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
        // Not yet configured — save to Waitlist table!
        const userId = await getUserId(request);
        if (userId) {
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            if (user?.email) {
                try {
                    await db.insert(waitlist).values({ email: user.email }).onConflictDoNothing();
                } catch (e) {
                    console.error('Failed to add to waitlist:', e);
                }
            }
        }

        return NextResponse.json(
            { message: 'Payments coming soon! We\'ll notify you when Premium launches.' },
            { status: 200 }
        );
    }

    // TODO: Wire in Stripe when ready
    // const stripe = new Stripe(stripeKey);
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   payment_method_types: ['card'],
    //   line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    //   success_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_URL}/`,
    // });
    // return NextResponse.json({ url: session.url });

    return NextResponse.json(
        { message: 'Payments coming soon!' },
        { status: 200 }
    );
}
