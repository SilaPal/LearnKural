'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Kural } from '@/shared/schema';
import dynamic from 'next/dynamic';

const KuralPlayingClient = dynamic(
  () => import('@/app/kural-playing/kural-playing-client'),
  { ssr: false }
);

interface Props {
  allKurals: Kural[];
}

export default function FavoritesPlayingClient({ allKurals }: Props) {
  const [favoriteKurals, setFavoriteKurals] = useState<Kural[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTamil, setIsTamil] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    }

    const savedBookmarks = localStorage.getItem('thirukural-bookmarks');
    if (savedBookmarks) {
      try {
        const bookmarkIds: number[] = JSON.parse(savedBookmarks);
        const favorites = allKurals.filter(k => bookmarkIds.includes(k.id));
        favorites.sort((a, b) => a.id - b.id);
        setFavoriteKurals(favorites);
      } catch {}
    }
    setIsLoading(false);
  }, [allKurals]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (favoriteKurals.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <span className="text-8xl mb-6">💔</span>
        <h2 className="text-2xl font-bold text-gray-700 mb-3">
          {isTamil ? 'பிடித்த குறள்கள் இல்லை' : 'No favorites to play'}
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          {isTamil 
            ? 'முதலில் சில குறள்களை பிடித்தவையாக சேர்க்கவும்!'
            : 'Add some kurals to your favorites first!'}
        </p>
        <Link 
          href="/kural-favorites"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {isTamil ? 'பிடித்தவைக்கு திரும்பு' : 'Back to Favorites'}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4 text-center text-sm">
        <Link href="/kural-favorites" className="inline-flex items-center gap-2 hover:underline">
          <span>❤️</span>
          {isTamil 
            ? `பிடித்த ${favoriteKurals.length} குறள்களை விளையாடுகிறீர்கள்`
            : `Playing with ${favoriteKurals.length} favorite kurals`}
        </Link>
      </div>
      <KuralPlayingClient initialKurals={favoriteKurals} />
    </>
  );
}
