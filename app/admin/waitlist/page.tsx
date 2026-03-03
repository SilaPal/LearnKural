import WaitlistClient from './waitlist-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin - Premium Waitlist',
    robots: 'noindex, nofollow',
};

export default function AdminWaitlistPage() {
    return <WaitlistClient />;
}
