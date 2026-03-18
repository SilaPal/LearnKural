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
  searchParams: Promise<{ game?: string; kural?: string; chapter?: string; embed?: string }>;
}

export default async function KuralPlayingPage({ searchParams }: PageProps) {
  const kurals = await getAllKurals();
  const params = await searchParams;
  const initialGame = params.game as 'puzzle' | 'flying' | 'balloon' | 'race' | undefined;
  const initialKuralId = params.kural ? parseInt(params.kural) : undefined;
  const initialChapter = params.chapter ? parseInt(params.chapter) : undefined;
  const isEmbed = params.embed === '1';

  const sampleKurals = kurals.slice(0, 6);

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
      <KuralPlayingClient
        initialKurals={kurals}
        initialGame={initialGame}
        initialKuralId={initialKuralId}
        initialChapter={initialChapter}
        isEmbed={isEmbed}
      />

      <section className="sr-only" aria-label="Thirukkural games description">
        <h1>Thirukkural Interactive Games | திருக்குறள் விளையாட்டுகள்</h1>
        <p>
          Learn all 1330 Thirukkural verses by Thiruvalluvar through 4 fun interactive educational games.
          These games are designed for children aged 6–14 and adults who want to master ancient Tamil wisdom
          while playing. Each game uses real Thirukkural verses in both Tamil and English.
        </p>

        <h2>Available Thirukkural Games - திருக்குறள் விளையாட்டு வகைகள்</h2>
        <ul>
          <li>
            <strong>Word Puzzle (சொல் புதிர்)</strong> — Arrange the scrambled Tamil words of a Thirukkural verse
            in the correct order. Improves memory and understanding of Tamil grammar structure.
          </li>
          <li>
            <strong>Flying Words (பறக்கும் சொற்கள்)</strong> — Catch the correct Tamil words as they fly across
            the screen to build the Thirukkural verse. Tests quick recognition of Tamil script.
          </li>
          <li>
            <strong>Balloon Pop (பலூன் வெடிப்பு)</strong> — Pop balloons containing the correct Tamil words
            to complete the kural. A fun game for young learners to identify Tamil letters and words.
          </li>
          <li>
            <strong>Race (போட்டி விளையாட்டு)</strong> — Race against time to arrange Thirukkural words correctly.
            Builds speed and familiarity with the Tamil verses.
          </li>
        </ul>

        <h2>Sample Thirukkural Verses Used in Games</h2>
        {sampleKurals.map(k => (
          <article key={k.id}>
            <h3>Thirukkural {k.id} — {k.subsection_english}</h3>
            <p lang="ta">{k.kural_tamil.replace(/\\n/g, ' ')}</p>
            <p>{k.kural_english}</p>
            <p lang="ta">{k.meaning_tamil}</p>
            <p>{k.meaning_english}</p>
          </article>
        ))}

        <h2>How to Play Thirukkural Games</h2>
        <p>
          Select any of the 1330 Thirukkural verses or choose a chapter to practice. The game will display
          the Tamil verse scrambled and you must arrange the words in the correct order to complete the
          Thirukkural couplet. Earn points for correct answers and improve your score on the leaderboard.
        </p>
        <p>
          These educational games help children learn Thirukkural (திருக்குறள்) — the ancient Tamil classic
          written by Thiruvalluvar — in an engaging and interactive way. All 1330 verses covering Virtue (அறம்),
          Wealth (பொருள்), and Love (இன்பம்) are available to practice.
        </p>
      </section>
    </>
  );
}
