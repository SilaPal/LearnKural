import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllKurals, getKuralBySlug } from '@/lib/kurals';
import KuralLearningClient from './kural-learning-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const kurals = await getAllKurals();
  return kurals.map((kural) => ({
    slug: kural.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const kural = await getKuralBySlug(slug);
  
  if (!kural) {
    return {
      title: 'Kural Not Found',
    };
  }

  const kuralPreview = kural.kural_tamil.replace(/\\n/g, ' ').substring(0, 100);
  
  const tamilPreview = kural.kural_tamil.replace(/\\n/g, ' ').substring(0, 80);
  
  return {
    title: `Thirukkural ${kural.id} | குறள் ${kural.id} - ${kuralPreview}`,
    description: `Learn Thirukkural ${kural.id}: "${kural.kural_english}". ${kural.meaning_english}. குறள் ${kural.id}: ${tamilPreview}. ${kural.meaning_tamil?.substring(0, 100) || ''}`,
    keywords: [
      `thirukkural ${kural.id}`,
      `kural ${kural.id}`,
      `குறள் ${kural.id}`,
      'tamil wisdom',
      'thiruvalluvar',
      'திருவள்ளுவர்',
      'learn tamil',
      'தமிழ் கற்க',
      'tamil pronunciation',
      kural.kural_tamil.split(' ')[0],
      kural.section_english || '',
    ].filter(Boolean),
    alternates: {
      canonical: `https://learnthirukkural.com/kural-learning/${kural.slug}`,
      languages: {
        'en': `https://learnthirukkural.com/kural-learning/${kural.slug}`,
        'ta': `https://learnthirukkural.com/kural-learning/${kural.slug}`,
        'x-default': `https://learnthirukkural.com/kural-learning/${kural.slug}`,
      },
    },
    openGraph: {
      title: `Thirukkural ${kural.id} | குறள் ${kural.id}`,
      description: `${kural.meaning_english}. ${kural.meaning_tamil?.substring(0, 100) || ''}`,
      url: `https://learnthirukkural.com/kural-learning/${kural.slug}`,
      type: 'article',
      locale: 'en_US',
      alternateLocale: 'ta_IN',
      images: kural.youtube_tamil_url ? [
        {
          url: `https://img.youtube.com/vi/${extractYouTubeId(kural.youtube_tamil_url)}/maxresdefault.jpg`,
          width: 1280,
          height: 720,
          alt: `Thirukkural ${kural.id} | குறள் ${kural.id} Video`,
        },
      ] : [],
    },
  };
}

function extractYouTubeId(url: string | null): string {
  if (!url) return '';
  const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

export default async function KuralLearningPage({ params }: Props) {
  const { slug } = await params;
  const kurals = await getAllKurals();
  const kural = kurals.find(k => k.slug === slug);
  const kuralIndex = kurals.findIndex(k => k.slug === slug);
  
  if (!kural || kuralIndex === -1) {
    notFound();
  }

  const youtubeId = extractYouTubeId(kural.youtube_tamil_url);
  const pageUrl = `https://learnthirukkural.com/kural-learning/${kural.slug}`;
  
  const learningResourceLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': pageUrl,
    name: `Thirukkural ${kural.id} | குறள் ${kural.id}`,
    description: `${kural.meaning_english}. ${kural.meaning_tamil || ''}`,
    author: {
      '@type': 'Person',
      name: 'Thiruvalluvar (திருவள்ளுவர்)',
    },
    inLanguage: ['ta', 'en'],
    educationalLevel: 'Beginner to Advanced',
    learningResourceType: 'Interactive Exercise',
    text: `${kural.kural_english} | ${kural.kural_tamil}`,
    url: pageUrl,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      suggestedMinAge: 6,
    },
    teaches: 'Tamil wisdom and ethics',
  };

  const videoLd = kural.youtube_tamil_url && youtubeId ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${pageUrl}#video`,
    name: `Thirukkural ${kural.id} - ${kural.kural_english?.substring(0, 50) || 'Tamil Wisdom'} | குறள் ${kural.id} விளக்கம்`,
    description: `Learn Thirukkural ${kural.id} with video explanation. ${kural.meaning_english}. ${kural.meaning_tamil || ''} திருக்குறள் ${kural.id} - ${kural.kural_tamil?.replace(/\\n/g, ' ').substring(0, 100)}`,
    thumbnailUrl: [
      `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`,
      `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    ],
    uploadDate: '2024-01-01T00:00:00+05:30',
    contentUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    inLanguage: 'ta',
    duration: 'PT3M',
    isFamilyFriendly: true,
    requiresSubscription: false,
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: 'Thirukkural Learning Platform',
      url: 'https://learnthirukkural.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://learnthirukkural.com/logo.png'
      }
    },
    potentialAction: {
      '@type': 'WatchAction',
      target: `https://www.youtube.com/watch?v=${youtubeId}`
    }
  } : null;

  const audioLdTamil = kural.audio_tamil_url ? {
    '@context': 'https://schema.org',
    '@type': 'AudioObject',
    '@id': `${pageUrl}#audio-tamil`,
    name: `Thirukkural ${kural.id} Tamil Pronunciation | குறள் ${kural.id} தமிழ் உச்சரிப்பு`,
    description: `Tamil pronunciation audio for Thirukkural ${kural.id}. ${kural.kural_tamil?.replace(/\\n/g, ' ')}`,
    contentUrl: kural.audio_tamil_url,
    encodingFormat: 'audio/mpeg',
    inLanguage: 'ta',
    isAccessibleForFree: true,
    duration: 'PT30S',
    transcript: kural.kural_tamil?.replace(/\\n/g, ' ') || ''
  } : null;

  const audioLdEnglish = kural.audio_english_url ? {
    '@context': 'https://schema.org',
    '@type': 'AudioObject',
    '@id': `${pageUrl}#audio-english`,
    name: `Thirukkural ${kural.id} English Pronunciation`,
    description: `English pronunciation audio for Thirukkural ${kural.id}. ${kural.kural_english}`,
    contentUrl: kural.audio_english_url,
    encodingFormat: 'audio/mpeg',
    inLanguage: 'en',
    isAccessibleForFree: true,
    duration: 'PT30S',
    transcript: kural.kural_english || ''
  } : null;

  const jsonLdArray = [
    learningResourceLd,
    videoLd,
    audioLdTamil,
    audioLdEnglish
  ].filter(Boolean);

  return (
    <>
      {jsonLdArray.map((jsonLd, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}
      
      <KuralLearningClient 
        kural={kural} 
        kuralIndex={kuralIndex}
        totalKurals={kurals.length}
        prevKuralSlug={kuralIndex > 0 ? kurals[kuralIndex - 1].slug : null}
        nextKuralSlug={kuralIndex < kurals.length - 1 ? kurals[kuralIndex + 1].slug : null}
        allKuralSlugs={kurals.map(k => ({ 
          id: k.id, 
          slug: k.slug,
          section_english: k.section_english,
          section_tamil: k.section_tamil,
          subsection_english: k.subsection_english,
          subsection_tamil: k.subsection_tamil,
          kural_tamil: k.kural_tamil,
          kural_english: k.kural_english,
          audio_tamil_url: k.audio_tamil_url,
          audio_english_url: k.audio_english_url,
        }))}
      />
    </>
  );
}
