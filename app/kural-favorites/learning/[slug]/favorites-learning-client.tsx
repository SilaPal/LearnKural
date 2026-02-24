'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Kural } from '@/shared/schema';
import dynamic from 'next/dynamic';

const KuralLearningClient = dynamic(
  () => import('@/app/kural-learning/[slug]/kural-learning-client'),
  { ssr: false }
);

interface KuralSlugMap {
  id: number;
  slug: string;
  section_english: string | null;
  section_tamil: string | null;
  subsection_english: string | null;
  subsection_tamil: string | null;
  kural_tamil: string;
  kural_english: string;
  audio_tamil_url: string | null;
  audio_english_url: string | null;
}

interface Props {
  kural: Kural;
  allKuralSlugs: KuralSlugMap[];
}

export default function FavoritesLearningClient({ kural, allKuralSlugs }: Props) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTamil, setIsTamil] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    }

    const savedBookmarks = localStorage.getItem('thirukural-bookmarks');
    if (savedBookmarks) {
      try {
        const bookmarkIds: number[] = JSON.parse(savedBookmarks);
        setFavoriteIds(bookmarkIds.sort((a, b) => a - b));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (favoriteIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <span className="text-8xl mb-6">💔</span>
        <h2 className="text-2xl font-bold text-gray-700 mb-3">
          {isTamil ? 'பிடித்த குறள்கள் இல்லை' : 'No favorites to learn'}
        </h2>
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

  const favoriteSlugs = allKuralSlugs.filter(k => favoriteIds.includes(k.id));
  const currentIndex = favoriteSlugs.findIndex(k => k.id === kural.id);
  
  const prevFavorite = currentIndex > 0 ? favoriteSlugs[currentIndex - 1] : null;
  const nextFavorite = currentIndex < favoriteSlugs.length - 1 ? favoriteSlugs[currentIndex + 1] : null;

  return (
    <>
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/kural-favorites" className="inline-flex items-center gap-2 hover:underline text-sm">
            <span>❤️</span>
            {isTamil 
              ? `பிடித்த குறள் ${currentIndex + 1} / ${favoriteSlugs.length}`
              : `Favorite ${currentIndex + 1} of ${favoriteSlugs.length}`}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevFavorite && router.push(`/kural-favorites/learning/${prevFavorite.slug}`)}
              disabled={!prevFavorite}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => nextFavorite && router.push(`/kural-favorites/learning/${nextFavorite.slug}`)}
              disabled={!nextFavorite}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <KuralLearningClient 
        kural={kural}
        kuralIndex={currentIndex}
        totalKurals={favoriteSlugs.length}
        prevKuralSlug={prevFavorite?.slug || null}
        nextKuralSlug={nextFavorite?.slug || null}
        allKuralSlugs={favoriteSlugs}
      />
    </>
  );
}
