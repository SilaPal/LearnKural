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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <HomeClient totalKurals={totalKurals} kuralOfDay={kuralOfDay} firstKuralSlug={firstKuralSlug} allKuralSlugs={allKuralSlugs} />
      </div>
    </>
  );
}
