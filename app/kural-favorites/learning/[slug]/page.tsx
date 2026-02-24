import { Metadata } from 'next';
import { getAllKurals } from '@/lib/kurals';
import FavoritesLearningClient from './favorites-learning-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Learn Favorite Kural | பிடித்த குறள் கற்க - Thirukkural Learning`,
    description: 'Learn your favorite Thirukkural verses with audio, video, and pronunciation practice.',
  };
}

export default async function FavoritesLearningPage({ params }: Props) {
  const { slug } = await params;
  const kurals = await getAllKurals();
  const currentKural = kurals.find(k => k.slug === slug);

  if (!currentKural) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Kural not found</p>
      </div>
    );
  }

  const allKuralSlugs = kurals.map(k => ({
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
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <FavoritesLearningClient 
        kural={currentKural}
        allKuralSlugs={allKuralSlugs}
      />
    </div>
  );
}
