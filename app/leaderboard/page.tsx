import { Metadata } from 'next';
import LeaderboardClient from '@/app/leaderboard/leaderboard-client';

export const metadata: Metadata = {
    title: 'Leaderboard | Learn Thirukkural Online',
    description: 'See the top students mastering Thirukkural from around the world. Track your rank globally and regionally.',
    alternates: { canonical: 'https://learnthirukkural.com/leaderboard' },
};

export default function LeaderboardPage() {
    return <LeaderboardClient />;
}
