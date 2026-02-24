import { Metadata } from 'next';
import ParentDashboardClient from '@/app/dashboard/parent/parent-client';

export const metadata: Metadata = {
    title: 'Parent Dashboard | Learn Thirukkural Online',
    description: 'Track your child\'s learning progress, achievements, and Tamil language mastery.',
};

export default function ParentDashboardPage() {
    return <ParentDashboardClient />;
}
