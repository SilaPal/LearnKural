import { Metadata } from 'next';
import { getAllKurals } from '@/lib/kurals';
import FavoritesClient from './favorites-client';

export const metadata: Metadata = {
  title: 'My Favorites | எனக்கு பிடித்தவை - Thirukkural Learning',
  description: 'View and listen to your favorite Thirukkural verses. உங்கள் பிடித்த திருக்குறள்களைக் காணவும் கேட்கவும்.',
};

export default async function FavoritesPage() {
  const kurals = await getAllKurals();
  
  const allKuralSlugs = kurals.map(k => ({
    id: k.id,
    slug: k.slug,
    kural_tamil: k.kural_tamil,
    kural_english: k.kural_english,
    audio_tamil_url: k.audio_tamil_url,
    audio_english_url: k.audio_english_url,
    section_tamil: k.section_tamil,
    section_english: k.section_english,
    subsection_tamil: k.subsection_tamil,
    subsection_english: k.subsection_english,
    meaning_tamil: k.meaning_tamil,
    meaning_english: k.meaning_english,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <FavoritesClient allKuralSlugs={allKuralSlugs} />
    </div>
  );
}
