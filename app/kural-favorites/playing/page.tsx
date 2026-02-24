import { Metadata } from 'next';
import { getAllKurals } from '@/lib/kurals';
import FavoritesPlayingClient from './favorites-playing-client';

export const metadata: Metadata = {
  title: 'Play Favorites | பிடித்த குறள்கள் விளையாட்டு - Thirukkural Learning',
  description: 'Play games with your favorite Thirukkural verses. உங்கள் பிடித்த திருக்குறள்களை விளையாடுங்கள்.',
};

export default async function FavoritesPlayingPage() {
  const kurals = await getAllKurals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <FavoritesPlayingClient allKurals={kurals} />
    </div>
  );
}
