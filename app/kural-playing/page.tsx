import { Metadata } from 'next';
import { getAllKurals } from '@/lib/kurals';
import KuralPlayingClient from './kural-playing-client';

export const metadata: Metadata = {
  title: 'Thirukkural Games | திருக்குறள் விளையாட்டுகள் - Puzzle, Flying, Balloon, Race',
  description: 'Learn Thirukkural through 4 interactive games: Word Puzzle, Flying Words, Balloon Pop, and Race. Fun educational games for children and adults. திருக்குறள் விளையாட்டுகள் - புதிர், பறக்கும் சொற்கள், பலூன் வெடிப்பு, போட்டி மூலம் குறள் கற்கவும்.',
  keywords: [
    'thirukkural game', 'tamil puzzle', 'word puzzle', 'educational game',
    'learn tamil', 'interactive learning', 'tamil for kids', 'balloon game',
    'race game', 'flying words', 'word arrangement',
    'திருக்குறள் விளையாட்டு', 'புதிர்', 'தமிழ் விளையாட்டு', 'குழந்தை விளையாட்டு',
    'கல்வி விளையாட்டு', 'பலூன் விளையாட்டு', 'போட்டி'
  ],
  alternates: {
    canonical: 'https://learnthirukkural.com/kural-playing',
    languages: {
      'en': 'https://learnthirukkural.com/kural-playing',
      'ta': 'https://learnthirukkural.com/kural-playing',
      'x-default': 'https://learnthirukkural.com/kural-playing',
    },
  },
  openGraph: {
    title: 'Thirukkural Games | திருக்குறள் விளையாட்டுகள்',
    description: 'Learn Thirukkural through 4 fun interactive games. திருக்குறள் விளையாட்டுகள் மூலம் குறள் கற்கவும்.',
    url: 'https://learnthirukkural.com/kural-playing',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ta_IN',
  },
};

interface PageProps {
  searchParams: Promise<{ game?: string; kural?: string }>;
}

export default async function KuralPlayingPage({ searchParams }: PageProps) {
  const kurals = await getAllKurals();
  const params = await searchParams;
  const initialGame = params.game as 'puzzle' | 'flying' | 'balloon' | 'race' | undefined;
  const initialKuralId = params.kural ? parseInt(params.kural) : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: 'Thirukkural Word Puzzle | திருக்குறள் விளையாட்டு',
    description: 'Educational word puzzle game to learn Thirukkural verses. திருக்குறள் கற்க கல்வி விளையாட்டு.',
    numberOfPlayers: '1',
    gameEdition: kurals.length + ' kurals',
    url: 'https://learnthirukkural.com/kural-playing',
    inLanguage: ['en', 'ta'],
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      suggestedMinAge: 6,
      suggestedMaxAge: 99,
    },
    educationalUse: ['learning', 'practice'],
    learningResourceType: 'Interactive Game',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KuralPlayingClient initialKurals={kurals} initialGame={initialGame} initialKuralId={initialKuralId} />
    </>
  );
}
