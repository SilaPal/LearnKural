'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PricingModal from '@/components/pricing-modal';
import { useAuth } from '@/lib/use-auth';
import { syncFavoritesToDB } from '@/lib/db-sync';

interface KuralSlugInfo {
  id: number;
  slug: string;
  kural_tamil: string;
  kural_english: string;
  audio_tamil_url: string | null;
  audio_english_url: string | null;
  section_tamil: string | null;
  section_english: string | null;
  subsection_tamil: string | null;
  subsection_english: string | null;
  meaning_tamil: string;
  meaning_english: string;
}

interface Props {
  allKuralSlugs: KuralSlugInfo[];
}

export default function FavoritesClient({ allKuralSlugs }: Props) {
  const [isTamil, setIsTamil] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    } else if (savedLang === 'english') {
      setIsTamil(false);
    } else {
      const browserLang = navigator.language || '';
      if (browserLang.toLowerCase().startsWith('ta')) {
        setIsTamil(true);
      }
    }

    const savedBookmarks = localStorage.getItem('thirukural-bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch { }
    }
  }, []);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetch('/api/user/favorites')
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then(data => {
          if (data && Array.isArray(data)) {
            setBookmarks(data);
            localStorage.setItem('thirukural-bookmarks', JSON.stringify(data));
          }
        })
        .catch(err => console.error('Failed to load favorites from DB', err));
    }
  }, [user]);

  const toggleLanguage = () => {
    const newLang = !isTamil;
    setIsTamil(newLang);
    localStorage.setItem('thirukural-language', newLang ? 'tamil' : 'english');
  };

  const playAudio = (kuralInfo: KuralSlugInfo) => {
    const audioUrl = isTamil ? kuralInfo.audio_tamil_url : kuralInfo.audio_english_url;
    if (!audioUrl) return;

    if (currentAudio) {
      currentAudio.pause();
    }

    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    setPlayingId(kuralInfo.id);

    audio.onended = () => {
      setPlayingId(null);
    };

    audio.play().catch(() => setPlayingId(null));
  };

  const removeBookmark = (id: number) => {
    const newBookmarks = bookmarks.filter(b => b !== id);
    setBookmarks(newBookmarks);
    localStorage.setItem('thirukural-bookmarks', JSON.stringify(newBookmarks));
    if (user) syncFavoritesToDB(newBookmarks);
  };

  const favoriteKurals = bookmarks
    .sort((a, b) => a - b)
    .map(id => allKuralSlugs.find(k => k.id === id))
    .filter(Boolean) as KuralSlugInfo[];

  return (
    <>
      <header className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 hover:bg-white/20 rounded-full transition">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <span>❤️</span>
                  {isTamil ? 'எனக்கு பிடித்தவை' : 'My Favorites'}
                </h1>
                <p className="text-sm opacity-90">
                  {favoriteKurals.length} {isTamil ? 'குறள்கள்' : 'kurals saved'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {isTamil ? 'English' : 'தமிழ்'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Free tier limit banner */}
        {bookmarks.length >= 8 && (
          <div className={`mb-4 rounded-xl p-4 flex items-center justify-between gap-3 ${bookmarks.length >= 10
            ? 'bg-red-50 border border-red-200'
            : 'bg-amber-50 border border-amber-200'
            }`}>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${bookmarks.length >= 10 ? 'text-red-700' : 'text-amber-700'}`}>
                {bookmarks.length >= 10
                  ? (isTamil ? '10/10 பிடித்தவை நிரம்பியது 🔒' : '10/10 favorites reached 🔒')
                  : (isTamil ? `${bookmarks.length}/10 பிடித்தவை பயன்படுத்தப்பட்டது` : `${bookmarks.length}/10 favorites used`)}
              </p>
              <p className={`text-xs mt-0.5 ${bookmarks.length >= 10 ? 'text-red-500' : 'text-amber-500'}`}>
                {isTamil
                  ? 'இன்னும் சேர்க்க பிரீமியம் திட்டத்திற்கு மேம்படுத்துங்கள்'
                  : 'Upgrade to Premium for unlimited favorites'}
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-white/70 rounded-full overflow-hidden w-48">
                <div
                  className={`h-full rounded-full transition-all ${bookmarks.length >= 10 ? 'bg-red-500' : 'bg-amber-400'}`}
                  style={{ width: `${Math.min((bookmarks.length / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setShowPricingModal(true)}
              className="shrink-0 text-xs bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold px-3 py-2 rounded-lg hover:opacity-90 transition"
            >
              {isTamil ? 'மேம்படுத்து ✨' : 'Upgrade ✨'}
            </button>
          </div>
        )}
        {favoriteKurals.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-8xl mb-6 block">💔</span>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">
              {isTamil ? 'பிடித்த குறள்கள் இல்லை' : 'No favorites yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isTamil
                ? 'குறள் கற்கும் பக்கத்தில் ❤️ பொத்தானைக் கிளிக் செய்து சேமியுங்கள்!'
                : 'Click the ❤️ button on any kural learning page to save it!'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              {isTamil ? 'கற்கத் தொடங்குங்கள்' : 'Start Learning'}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-end gap-2 mb-4">
              <Link
                href="/kural-favorites/playing"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>{isTamil ? 'விளையாடு' : 'Play'}</span>
              </Link>
              <Link
                href={`/kural-favorites/learning/${favoriteKurals[0]?.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                <span>{isTamil ? 'கற்க' : 'Learn'}</span>
              </Link>
            </div>
            <div className="space-y-4">
              {favoriteKurals.map((kuralInfo) => {
                const kuralText = isTamil ? kuralInfo.kural_tamil : kuralInfo.kural_english;
                const meaningText = isTamil ? kuralInfo.meaning_tamil : kuralInfo.meaning_english;
                const hasAudio = isTamil ? kuralInfo.audio_tamil_url : kuralInfo.audio_english_url;
                const isPlaying = playingId === kuralInfo.id;

                const sectionName = isTamil ? kuralInfo.section_tamil : kuralInfo.section_english;
                const subsectionName = isTamil ? kuralInfo.subsection_tamil : kuralInfo.subsection_english;

                return (
                  <div
                    key={kuralInfo.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5 border border-red-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-red-500 to-pink-500 text-white font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                        {kuralInfo.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                          {kuralText?.replace(/\\n/g, '\n')}
                        </p>
                        {meaningText && (
                          <p className="text-gray-600 text-sm mt-2 italic">
                            {meaningText}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1.5">
                        {sectionName && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {sectionName}
                          </span>
                        )}
                        {subsectionName && (
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">
                            {subsectionName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasAudio && (
                          <button
                            onClick={() => playAudio(kuralInfo)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${isPlaying
                              ? 'bg-purple-500 text-white animate-pulse'
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                              }`}
                          >
                            {isPlaying ? (
                              <>
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                  <rect x="6" y="4" width="4" height="16" />
                                  <rect x="14" y="4" width="4" height="16" />
                                </svg>
                                <span className="text-sm font-medium">{isTamil ? 'ஒலிக்கிறது...' : 'Playing...'}</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5,3 19,12 5,21" />
                                </svg>
                                <span className="text-sm font-medium">{isTamil ? 'கேள்' : 'Listen'}</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => removeBookmark(kuralInfo.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                          title={isTamil ? 'நீக்கு' : 'Remove'}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        isTamil={isTamil}
      />
    </>
  );
}
