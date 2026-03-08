import { Metadata } from 'next';
import { getAllKurals } from '@/lib/kurals';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: 'Learn Thirukkural Online | திருக்குறள் கற்க - Interactive Tamil Wisdom Learning Platform',
  description: 'Learn ancient Tamil wisdom through 1330 Thirukkural verses with interactive audio pronunciation, speech recognition practice, video lessons, and word puzzles. திருக்குறள் கற்றுக்கொள்ளுங்கள் - ஒலி உச்சரிப்பு, வீடியோ பாடங்கள், விளையாட்டுகள் மூலம் 1330 குறள்களை கற்கவும்.',
  keywords: [
    'Thirukkural', 'Tamil wisdom', 'learn Tamil', 'ancient Tamil literature', 'Thiruvalluvar',
    'Tamil stories for kids', 'educational games', 'pronunciation practice', 'interactive learning',
    'திருக்குறள்', 'குறள்', 'திருவள்ளுவர்', 'தமிழ் கற்க', 'தமிழ் விளையாட்டு',
    'குழந்தைகளுக்கான தமிழ்', 'தமிழ் உச்சரிப்பு', 'தமிழ் கல்வி'
  ],
  alternates: {
    canonical: 'https://learnthirukkural.com',
    languages: {
      'en': 'https://learnthirukkural.com',
      'ta': 'https://learnthirukkural.com',
      'x-default': 'https://learnthirukkural.com',
    },
  },
  openGraph: {
    title: 'Learn Thirukkural Online | திருக்குறள் கற்க',
    description: 'Discover ancient Tamil wisdom through 1330 Thirukkural verses with audio, video, and interactive games. திருக்குறள் - ஒலி, வீடியோ, விளையாட்டுகள் மூலம் கற்கவும்.',
    url: 'https://learnthirukkural.com',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ta_IN',
  },
};

export default async function HomePage() {
  const kurals = await getAllKurals();
  const totalKurals = kurals.length;

  // Get kural of the day based on current date - prioritize kurals with videos
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

  // Filter kurals that have YouTube videos
  const kuralsWithVideos = kurals.filter(k => k.youtube_tamil_url || k.youtube_english_url);

  let kuralOfDay;
  if (kuralsWithVideos.length > 0) {
    // Pick from kurals with videos
    const videoKuralIndex = dayOfYear % kuralsWithVideos.length;
    kuralOfDay = kuralsWithVideos[videoKuralIndex];
  } else {
    // Fallback to any kural
    const kuralOfDayIndex = dayOfYear % totalKurals;
    kuralOfDay = kurals[kuralOfDayIndex] || kurals[0];
  }

  const firstKuralSlug = kurals[0]?.slug || 'kural-1';

  const allKuralSlugs = kurals.map(k => ({
    id: k.id,
    slug: k.slug,
    section_english: k.section_english,
    section_tamil: k.section_tamil,
    subsection_english: k.subsection_english,
    subsection_tamil: k.subsection_tamil,
    kural_tamil: k.kural_tamil,
    kural_english: k.kural_english,
    meaning_tamil: k.meaning_tamil,
    meaning_english: k.meaning_english,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Thirukkural Learning Platform | திருக்குறள் கற்றல் தளம்',
    description: 'Learn ancient Tamil wisdom through 1330 Thirukkural verses with audio, video, and interactive games. திருக்குறள் கற்க - ஒலி, வீடியோ, விளையாட்டுகள் மூலம்.',
    url: 'https://learnthirukkural.com',
    inLanguage: ['en', 'ta'],
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://learnthirukkural.com/kural-learning/{search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Thirukkural Learning Platform',
      url: 'https://learnthirukkural.com',
    },
    about: {
      '@type': 'Thing',
      name: 'Thirukkural (திருக்குறள்)',
      description: 'Ancient Tamil classic by Thiruvalluvar containing 1330 couplets on virtue, wealth, and love.',
    },
  };

  const sections = new Map<string, { english: string; tamil: string; kurals: { id: number; slug: string }[] }>();
  for (const k of kurals) {
    const key = k.section_english || 'Other';
    if (!sections.has(key)) {
      sections.set(key, { english: key, tamil: k.section_tamil || 'மற்றவை', kurals: [] });
    }
    if (sections.get(key)!.kurals.length < 3) {
      sections.get(key)!.kurals.push({ id: k.id, slug: k.slug });
    }
  }

  const featuredKurals = kurals.slice(0, 5);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <HomeClient totalKurals={totalKurals} kuralOfDay={kuralOfDay} firstKuralSlug={firstKuralSlug} allKuralSlugs={allKuralSlugs} />

        <section className="sr-only" aria-label="Thirukkural content for search engines">
          <h1>Learn Thirukkural Online - திருக்குறள் கற்க</h1>
          <p>
            Thirukkural (திருக்குறள்) is an ancient Tamil classic written by the poet-saint Thiruvalluvar (திருவள்ளுவர்) over 2000 years ago.
            It contains 1330 couplets (kurals) organized into 133 chapters, covering three main themes: Aram (Virtue/அறத்துப்பால்),
            Porul (Wealth/பொருட்பால்), and Inbam (Love/காமத்துப்பால்). Each kural is a two-line verse that conveys profound wisdom
            about ethics, governance, love, and daily life. This platform helps children aged 6-14 learn Thirukkural through
            interactive audio pronunciation, video lessons, speech recognition practice, and educational games.
          </p>

          <h2>Kural of the Day - இன்றைய குறள் #{kuralOfDay.id}</h2>
          <div>
            <h3>Tamil - தமிழ்</h3>
            <p lang="ta">{kuralOfDay.kural_tamil.replace(/\\n/g, '\n')}</p>
            <p lang="ta">{kuralOfDay.meaning_tamil}</p>
            <h3>English</h3>
            <p>{kuralOfDay.kural_english}</p>
            <p>{kuralOfDay.meaning_english}</p>
            <a href={`/kural-learning/${kuralOfDay.slug}`}>Learn Thirukkural {kuralOfDay.id} - குறள் {kuralOfDay.id} கற்க</a>
          </div>

          <h2>Featured Thirukkural Verses - சிறப்பு திருக்குறள்கள்</h2>
          {featuredKurals.map(k => (
            <article key={k.id}>
              <h3>
                <a href={`/kural-learning/${k.slug}`}>Thirukkural {k.id} - குறள் {k.id}</a>
              </h3>
              <p lang="ta">{k.kural_tamil.replace(/\\n/g, '\n')}</p>
              <p>{k.kural_english}</p>
              <p lang="ta">{k.meaning_tamil}</p>
              <p>{k.meaning_english}</p>
            </article>
          ))}

          <h2>Thirukkural Chapters - திருக்குறள் அதிகாரங்கள்</h2>
          <p>Explore all {totalKurals} Thirukkural verses organized by section and chapter:</p>
          <nav aria-label="Thirukkural chapters">
            <ul>
              {Array.from(sections.entries()).map(([key, section]) => (
                <li key={key}>
                  <strong>{section.english} - {section.tamil}</strong>
                  <ul>
                    {section.kurals.map(k => (
                      <li key={k.id}>
                        <a href={`/kural-learning/${k.slug}`}>Kural {k.id} - குறள் {k.id}</a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>

          <h2>Learning Features - கற்றல் அம்சங்கள்</h2>
          <ul>
            <li>Audio pronunciation for all 1330 Thirukkural verses in Tamil and English - அனைத்து 1330 குறள்களுக்கும் தமிழ் மற்றும் ஆங்கில ஒலி உச்சரிப்பு</li>
            <li>Speech recognition practice for Tamil pronunciation - தமிழ் உச்சரிப்பு பயிற்சி</li>
            <li>Video lessons explaining each Thirukkural - ஒவ்வொரு திருக்குறளையும் விளக்கும் வீடியோ பாடங்கள்</li>
            <li>Interactive word puzzle games - ஊடாடும் சொல் புதிர் விளையாட்டுகள்</li>
            <li>Tamil letter learning with tracing and quizzes - தமிழ் எழுத்துக்கள் கற்க</li>
            <li>Achievement badges and progress tracking - சாதனை பேட்ஜ்கள் மற்றும் முன்னேற்ற கண்காணிப்பு</li>
            <li>Leaderboard and weekly challenges - தரவரிசை பட்டியல் மற்றும் வாராந்திர சவால்கள்</li>
          </ul>
        </section>
      </div>
    </>
  );
}
