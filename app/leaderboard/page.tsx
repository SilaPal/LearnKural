import { Metadata } from 'next';
import LeaderboardClient from '@/app/leaderboard/leaderboard-client';

export const metadata: Metadata = {
    title: 'Leaderboard | Learn Thirukkural Online | தரவரிசை பட்டியல்',
    description: 'See the top students mastering Thirukkural from around the world. Track your rank globally and regionally. Earn XP by learning Thirukkural verses and compete with others.',
    alternates: { canonical: 'https://learnthirukkural.com/leaderboard' },
    openGraph: {
        title: 'Thirukkural Leaderboard | Top Learners',
        description: 'See who is mastering Thirukkural. Earn XP by learning verses and climb the global leaderboard.',
        url: 'https://learnthirukkural.com/leaderboard',
    },
};

export default function LeaderboardPage() {
    return (
        <>
            <LeaderboardClient />

            <section className="sr-only" aria-label="Leaderboard description">
                <h1>Thirukkural Leaderboard — தரவரிசை பட்டியல்</h1>
                <p>
                    The Thirukkural Leaderboard ranks students and learners who are mastering the ancient Tamil
                    classic Thirukkural by Thiruvalluvar. Earn XP (experience points) by learning Thirukkural
                    verses, completing word puzzles, practising Tamil pronunciation, and finishing quests.
                    Compete with learners from around the world and from your school or region.
                </p>

                <h2>How to Earn XP and Climb the Leaderboard</h2>
                <ul>
                    <li>Learn and complete Thirukkural verses — குறள்களை கற்று முடிக்கவும்</li>
                    <li>Play word puzzle games with Thirukkural — திருக்குறள் சொல் புதிர் விளையாட்டுகள்</li>
                    <li>Practise Tamil pronunciation using speech recognition — தமிழ் உச்சரிப்பு பயிற்சி</li>
                    <li>Complete chapters in Kural Quest — குறள் வினாடி வினா முடிக்கவும்</li>
                    <li>Watch Tamil and English explanation videos — தமிழ் மற்றும் ஆங்கில விளக்க வீடியோக்கள்</li>
                    <li>Earn achievement badges — சாதனை பேட்ஜ்கள் பெறவும்</li>
                </ul>

                <h2>About Thirukkural — திருக்குறள் பற்றி</h2>
                <p>
                    Thirukkural (திருக்குறள்) is an ancient Tamil classic written by the poet-saint Thiruvalluvar
                    over 2000 years ago. It contains 1330 couplets (kurals) organized into 133 chapters across
                    three books: Virtue (அறத்துப்பால்), Wealth (பொருட்பால்), and Love (காமத்துப்பால்).
                    The leaderboard resets weekly, giving every learner a fresh chance to top the rankings.
                </p>

                <h2>Leaderboard Categories</h2>
                <ul>
                    <li>Global leaderboard — top Thirukkural learners worldwide</li>
                    <li>Regional leaderboard — top learners in your region or country</li>
                    <li>School leaderboard — top students within your school</li>
                    <li>Weekly XP rankings — resets every week for fair competition</li>
                </ul>
            </section>
        </>
    );
}
