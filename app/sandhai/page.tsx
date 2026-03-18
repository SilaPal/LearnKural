import { Metadata } from 'next';
import SandhaiClient from './sandhai-client';

export const metadata: Metadata = {
    title: 'Sandhai - Avatar Shop | சந்தை - திருக்குறள் கற்றல் | Learn Thirukkural',
    description: 'Spend your earned coins to unlock unique animated avatars in the Sandhai shop. Earn coins by learning Thirukkural verses, completing quests, and winning games.',
    alternates: { canonical: 'https://learnthirukkural.com/sandhai' },
    openGraph: {
        title: 'Sandhai Avatar Shop | Thirukkural Learning',
        description: 'Unlock animated avatars by earning coins through learning Thirukkural. The more you learn, the more you earn.',
        url: 'https://learnthirukkural.com/sandhai',
    },
};

export default function SandhaiPage() {
    return (
        <>
            <SandhaiClient />

            <section className="sr-only" aria-label="Sandhai shop description">
                <h1>Sandhai — திருக்குறள் அவதார் சந்தை | Thirukkural Avatar Shop</h1>
                <p>
                    Sandhai (சந்தை meaning "market" in Tamil) is the virtual avatar shop in the Thirukkural
                    learning platform. Earn coins by studying Thirukkural verses, completing quests, playing
                    word puzzle games, and practising Tamil pronunciation. Spend your coins to unlock unique
                    animated Lottie avatars that represent your learning journey.
                </p>

                <h2>How to Earn Coins — நாணயங்கள் சம்பாதிக்கும் வழிகள்</h2>
                <ul>
                    <li>Learn Thirukkural verses with audio — ஒலியுடன் திருக்குறள் கற்கவும்</li>
                    <li>Complete word puzzle games — சொல் புதிர் விளையாட்டுகள் முடிக்கவும்</li>
                    <li>Practise Tamil pronunciation — தமிழ் உச்சரிப்பு பயிற்சி செய்யவும்</li>
                    <li>Progress through Kural Quest chapters — குறள் வினாடி வினா அத்தியாயங்கள் முடிக்கவும்</li>
                    <li>Earn achievement badges — சாதனை பேட்ஜ்கள் பெறவும்</li>
                    <li>Maintain daily learning streaks — தினசரி கற்றல் தொடர்ச்சி பேணவும்</li>
                </ul>

                <h2>Available Avatars — கிடைக்கும் அவதாரங்கள்</h2>
                <p>
                    Sandhai features animated Lottie avatars including free starter avatars and premium avatars
                    that can be unlocked with coins earned through Thirukkural learning. Each avatar is a fun
                    animated character that represents your profile on the leaderboard and throughout the platform.
                    Avatars include characters like Banana, Arun, Parrot, StickMan, StickGirl, and Nila.
                </p>

                <h2>About Thirukkural Learning Platform</h2>
                <p>
                    This platform helps children aged 6–14 and Tamil learners worldwide master Thirukkural
                    (திருக்குறள்) — the 2000-year-old Tamil classic by Thiruvalluvar containing 1330 couplets
                    on virtue, wealth, and love. Sign in with Google to track your progress, earn coins, unlock
                    avatars, and appear on the global leaderboard.
                </p>
            </section>
        </>
    );
}
