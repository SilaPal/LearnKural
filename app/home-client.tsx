'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';
import PricingModal from '@/components/pricing-modal';
import { NavigationModal, KuralSlugMap as NavKuralSlugMap } from '@/components/navigation-modal';
import { getAllBadges, getMasteredCount, getStreakData, recordDailyVisit, checkStreakBadge, saveBadge, Badge } from '@/lib/badge-system';
import { useAuth } from '@/lib/use-auth';
import { syncFavoritesToDB } from '@/lib/db-sync';

type CelebrationType = 'confetti' | 'fireworks' | 'stars' | 'balloons' | 'sparkles' | 'snow' | 'golden' | null;

interface ExpandableSectionProps {
  title: string;
  titleTamil?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isTamil?: boolean;
}

function ExpandableSection({ title, titleTamil, icon, children, defaultOpen = false, isTamil = false }: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
      <button
        className="w-full cursor-pointer transition-colors hover:bg-gray-50 p-6 flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="text-lg font-semibold text-gray-800">{isTamil && titleTamil ? titleTamil : title}</span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <div className="prose prose-gray max-w-none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface KuralOfDay {
  id: number;
  kural_tamil: string;
  kural_english: string;
  meaning_tamil: string;
  meaning_english: string;
  audio_tamil_url: string | null;
  audio_english_url: string | null;
  youtube_tamil_url: string | null;
  youtube_english_url: string | null;
  slug: string;
}

interface KuralSlugMap {
  id: number;
  slug: string;
  kural_tamil?: string;
  kural_english?: string;
  audio_tamil_url?: string;
  audio_english_url?: string;
  section_english?: string | null;
  section_tamil?: string | null;
  subsection_english?: string | null;
  subsection_tamil?: string | null;
}

interface HomeClientProps {
  totalKurals: number;
  kuralOfDay: KuralOfDay;
  firstKuralSlug: string;
  allKuralSlugs: KuralSlugMap[];
}

export default function HomeClient({ totalKurals, kuralOfDay, firstKuralSlug, allKuralSlugs }: HomeClientProps) {
  const [isTamil, setIsTamil] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showShine, setShowShine] = useState(false);
  const [kuralMode, setKuralMode] = useState<'video' | 'game'>('video');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [celebrationType, setCelebrationType] = useState<CelebrationType>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [newBadgeCount, setNewBadgeCount] = useState(0);
  const [showNavModal, setShowNavModal] = useState(false);
  const [visitedKurals, setVisitedKurals] = useState<number[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedHomeGame, setSelectedHomeGame] = useState<'puzzle' | 'flying' | 'balloon' | 'race'>('puzzle');
  const [iframeLoading, setIframeLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const isPaidUser = user?.tier === 'paid';
  const FREE_FAVORITES_LIMIT = 10;

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

    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('thirukural-last-visit');
    if (lastVisit !== today) {
      setShowShine(true);
      localStorage.setItem('thirukural-last-visit', today);
      setTimeout(() => setShowShine(false), 4000);
    }

    const savedBookmarks = localStorage.getItem('thirukural-bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch { }
    }

    const visited = localStorage.getItem('thirukural-visited-kurals');
    if (visited) {
      try {
        setVisitedKurals(JSON.parse(visited));
      } catch { }
    }

    // Badge system - check streak on visit
    setBadgeCount(getAllBadges().length);
    const unviewedBadges = getAllBadges().filter(b => !b.viewed);
    setNewBadgeCount(unviewedBadges.length);

    // Record daily visit and check streak badge
    recordDailyVisit();
    const streakData = getStreakData();
    const streakBadge = checkStreakBadge(streakData.currentStreak);
    if (streakBadge) {
      saveBadge(streakBadge);
      setBadgeCount(getAllBadges().length);
      setNewBadgeCount(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch Favorites
      fetch('/api/user/favorites')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data)) {
            setBookmarks(data);
            localStorage.setItem('thirukural-bookmarks', JSON.stringify(data));
          }
        })
        .catch(err => console.error('Failed to load favorites', err));

      // Fetch Progress (Badges)
      fetch('/api/user/progress')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.badges) {
            localStorage.setItem('learntamil-badges', JSON.stringify(data.badges));
          }
        })
        .catch(err => console.error('Failed to load progress', err));
    }
  }, [user]);

  const toggleLanguage = () => {
    const newLang = !isTamil;
    setIsTamil(newLang);
    localStorage.setItem('thirukural-language', newLang ? 'tamil' : 'english');
  };

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const toggleBookmark = (kuralId: number) => {
    // Free tier: max 10 favorites
    if (!isPaidUser && !bookmarks.includes(kuralId) && bookmarks.length >= FREE_FAVORITES_LIMIT) {
      setShowPricingModal(true);
      return;
    }
    const newBookmarks = bookmarks.includes(kuralId)
      ? bookmarks.filter(id => id !== kuralId)
      : [...bookmarks, kuralId];
    setBookmarks(newBookmarks);
    localStorage.setItem('thirukural-bookmarks', JSON.stringify(newBookmarks));
    if (user) syncFavoritesToDB(newBookmarks);
  };

  return (
    <>
      <header className="relative bg-gradient-to-br from-purple-800 via-purple-600 to-violet-500 text-white py-6 sm:py-8">
        {/* Auth Button — top right corner */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10" ref={userMenuRef}>
          {user ? (
            <>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title={user.name}
                aria-label={isTamil ? 'பயனர் மெனு' : 'User menu'}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-9 w-9 rounded-full border-2 border-white/60 shadow-lg"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-white/20 border-2 border-white/60 shadow-lg flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  {/* Plan Badge */}
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{isPaidUser ? '✨' : '🆓'}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {isPaidUser
                            ? (isTamil ? 'பிரீமியம்' : 'Premium Plan')
                            : (isTamil ? 'இலவச திட்டம்' : 'Free Plan')}
                        </span>
                      </div>
                      {!isPaidUser && (
                        <button
                          onClick={() => { setShowUserMenu(false); setShowPricingModal(true); }}
                          className="text-xs bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold px-2.5 py-1 rounded-full hover:opacity-90 transition"
                        >
                          {isTamil ? 'மேம்படுத்து' : 'Upgrade'}
                        </button>
                      )}
                    </div>
                    {!isPaidUser && (
                      <p className="text-xs text-gray-400 mt-1">
                        {isTamil
                          ? `${bookmarks.length}/10 பிடித்தவை`
                          : `${bookmarks.length}/10 favorites used`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => { await logout(); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {isTamil ? 'வெளியேறு' : 'Logout'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              id="login-btn"
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-lg transition-all text-sm font-semibold backdrop-blur-sm shadow"
              title={isTamil ? 'உள்நுழைவு / பதிவு' : 'Login / Sign Up'}
              aria-label={isTamil ? 'உள்நுழைவு' : 'Login'}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {isTamil ? 'உள்நுழைவு' : 'Login'}
            </button>
          )}
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/logo.png" alt="Tamili Logo" className="h-12 w-12 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-bold">திருக்குறள்</h1>
          </div>
          <p className="text-sm sm:text-base mb-4 opacity-90">
            <span className="font-bold">
              {isTamil
                ? 'அர்த்தமுள்ள வாழ்க்கைக்கான காலத்தால் அழியாத படிப்பினைகள்'
                : 'Timeless teachings for a meaningful life'
              }
            </span>
            <br />
            <span className="mt-1 inline-block">{totalKurals} {isTamil ? 'குறள்கள்' : 'verses available'}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href={`/kural-learning/${firstKuralSlug}`}
              className="inline-flex items-center text-sm px-4 py-2 bg-amber-100 text-purple-800 hover:bg-amber-200 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              {isTamil ? 'கற்கத் தொடங்குங்கள்' : 'Start Learning'}
            </Link>
            <Link
              href="/kural-playing"
              className="inline-flex items-center text-sm px-4 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              {isTamil ? 'விளையாடிக் கற்க' : 'Learn by Playing'}
            </Link>
            <Link
              href="/learntamil"
              className="inline-flex items-center text-sm px-4 py-2 bg-orange-100 text-orange-800 hover:bg-orange-200 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              {isTamil ? 'தமிழ் எழுத்து கற்க' : 'Learn Tamil Letters'}
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={() => setShowNavModal(true)}
            className="relative hover:scale-110 transition-transform"
            title={isTamil ? 'எனது முன்னேற்றம்' : 'My Progress'}
          >
            <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🔥</span>
            </div>
          </button>
          <button
            onClick={() => {
              const allBadges = getAllBadges();
              const unviewedBadges = allBadges.filter(b => !b.viewed);
              if (unviewedBadges.length > 0) {
                const lastBadge = unviewedBadges[unviewedBadges.length - 1];
                if (lastBadge.tier === 'diamond') setCelebrationType('golden');
                else if (lastBadge.tier === 'gold') setCelebrationType('fireworks');
                else if (lastBadge.tier === 'silver') setCelebrationType('snow');
                else setCelebrationType('sparkles');
              } else if (allBadges.length > 0) {
                setCelebrationType('sparkles');
              }
              setShowBadgeModal(true);
              setNewBadgeCount(0);
            }}
            className="relative hover:scale-110 transition-transform"
            title={isTamil ? 'சாதனை பேட்ஜ்கள்' : 'Achievement Badges'}
          >
            <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏅</span>
            </div>
            {newBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce font-bold">
                {newBadgeCount}
              </span>
            )}
            {badgeCount > 0 && newBadgeCount === 0 && (
              <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {badgeCount}
              </span>
            )}
          </button>
          <Link
            href="/kural-favorites"
            className="relative hover:scale-110 transition-transform"
            title={isTamil ? 'பிடித்த குறள்கள்' : 'My Favorites'}
          >
            <svg className="h-12 w-12 text-red-500 hover:text-red-600 transition-colors drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {bookmarks.length > 0 && (
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold" style={{ paddingBottom: '2px' }}>
                {bookmarks.length}
              </span>
            )}
          </Link>
          <Link
            href="/leaderboard"
            className="relative hover:scale-110 transition-transform"
            title={isTamil ? 'தலைமுறைப் பட்டியல்' : 'Leaderboard'}
          >
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏆</span>
            </div>
          </Link>

          {user && (
            <Link
              href={
                user.role === 'school_admin' ? '/dashboard/school' :
                  user.role === 'teacher' ? '/dashboard/teacher' :
                    user.role === 'parent' ? '/dashboard/parent' :
                      '/schools/register'
              }
              className="relative hover:scale-110 transition-transform"
              title={
                user.role === 'student' ? (isTamil ? 'பள்ளியில் சேர' : 'Join a School') :
                  (isTamil ? 'நிர்வாக மேடை' : 'Dashboard')
              }
            >
              <div className="h-12 w-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">{user.role === 'student' ? '🏫' : '📊'}</span>
              </div>
            </Link>
          )}

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {isTamil ? 'English' : 'தமிழ்'}
          </button>
        </div>

        {/* Kural Quest Map Banner */}
        <Link href="/quest" className="group block mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-indigo-700 p-8 shadow-2xl transition-all hover:scale-[1.01] active:scale-95">
          <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity bg-cover bg-center" style={{ backgroundImage: 'url("/quest-map-bg.png")' }}></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                <span className="text-4xl">🗺️</span>
                {isTamil ? 'குறள் பயணம்' : 'Kural Quest'}
              </h2>
              <p className="text-teal-50 text-lg font-medium opacity-90">
                {isTamil ? 'அத்தியாயங்களை விளையாடி 133 நிலைகளை கடந்து வெற்றி பெறுங்கள்!' : 'Embark on a journey through 133 chapters. Play games to unlock the kingdoms!'}
              </p>
            </div>
            <div className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black shadow-xl group-hover:bg-indigo-50 transition-colors uppercase tracking-widest text-sm">
              {isTamil ? 'தொடங்கு' : 'Start Journey'}
            </div>
          </div>
        </Link>

        {/* Kural of the Day Section */}
        <div className="mb-6 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg shadow-md overflow-hidden border border-purple-200">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <svg className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-lg font-semibold text-gray-800">
                {isTamil ? 'இன்றைய குறள்' : 'Kural of the Day'}
              </span>
              <span className="ml-auto bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                #{kuralOfDay.id}
              </span>
            </div>

            {/* Video/Game Toggle */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex bg-purple-100 rounded-full p-1">
                <button
                  onClick={() => setKuralMode('video')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${kuralMode === 'video'
                    ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md'
                    : 'text-purple-700 hover:bg-purple-200'
                    }`}
                >
                  <span>🎬</span>
                  <span>{isTamil ? 'வீடியோ' : 'Video'}</span>
                </button>
                <button
                  onClick={() => setKuralMode('game')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${kuralMode === 'game'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                    : 'text-purple-700 hover:bg-purple-200'
                    }`}
                >
                  <span>🎮</span>
                  <span>{isTamil ? 'விளையாட்டு' : 'Play'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-3 border border-purple-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 relative">
                  {showShine && (
                    <>
                      {/* Top row */}
                      <span className="absolute -top-3 -left-3 text-yellow-400 animate-pulse text-xl">✦</span>
                      <span className="absolute -top-2 left-1/6 text-yellow-300 animate-pulse text-sm" style={{ animationDelay: '0.15s' }}>✧</span>
                      <span className="absolute -top-3 left-1/4 text-yellow-400 animate-pulse text-base" style={{ animationDelay: '0.3s' }}>★</span>
                      <span className="absolute -top-2 left-2/5 text-yellow-300 animate-pulse text-xs" style={{ animationDelay: '0.45s' }}>✦</span>
                      <span className="absolute -top-3 left-1/2 text-yellow-400 animate-pulse text-lg" style={{ animationDelay: '0.6s' }}>✧</span>
                      <span className="absolute -top-2 left-3/5 text-yellow-300 animate-pulse text-sm" style={{ animationDelay: '0.75s' }}>★</span>
                      <span className="absolute -top-3 right-1/4 text-yellow-400 animate-pulse text-base" style={{ animationDelay: '0.9s' }}>✦</span>
                      <span className="absolute -top-2 right-1/6 text-yellow-300 animate-pulse text-xs" style={{ animationDelay: '0.2s' }}>✧</span>
                      <span className="absolute -top-3 -right-3 text-yellow-400 animate-pulse text-xl" style={{ animationDelay: '0.35s' }}>★</span>
                      {/* Left side */}
                      <span className="absolute top-1/4 -left-4 text-yellow-400 animate-pulse text-lg" style={{ animationDelay: '0.5s' }}>✧</span>
                      <span className="absolute top-2/5 -left-3 text-yellow-300 animate-pulse text-sm" style={{ animationDelay: '0.65s' }}>★</span>
                      <span className="absolute top-1/2 -left-4 text-yellow-400 animate-pulse text-base" style={{ animationDelay: '0.8s' }}>✦</span>
                      <span className="absolute top-3/5 -left-3 text-yellow-300 animate-pulse text-xs" style={{ animationDelay: '0.25s' }}>✧</span>
                      <span className="absolute top-3/4 -left-4 text-yellow-400 animate-pulse text-lg" style={{ animationDelay: '0.4s' }}>★</span>
                      {/* Right side */}
                      <span className="absolute top-1/4 -right-4 text-yellow-300 animate-pulse text-base" style={{ animationDelay: '0.55s' }}>✦</span>
                      <span className="absolute top-2/5 -right-3 text-yellow-400 animate-pulse text-sm" style={{ animationDelay: '0.7s' }}>✧</span>
                      <span className="absolute top-1/2 -right-4 text-yellow-300 animate-pulse text-lg" style={{ animationDelay: '0.85s' }}>★</span>
                      <span className="absolute top-3/5 -right-3 text-yellow-400 animate-pulse text-xs" style={{ animationDelay: '0.1s' }}>✦</span>
                      <span className="absolute top-3/4 -right-4 text-yellow-300 animate-pulse text-base" style={{ animationDelay: '0.95s' }}>✧</span>
                      {/* Bottom row */}
                      <span className="absolute -bottom-3 -left-3 text-yellow-300 animate-pulse text-xl" style={{ animationDelay: '0.05s' }}>★</span>
                      <span className="absolute -bottom-2 left-1/6 text-yellow-400 animate-pulse text-sm" style={{ animationDelay: '0.2s' }}>✦</span>
                      <span className="absolute -bottom-3 left-1/4 text-yellow-300 animate-pulse text-base" style={{ animationDelay: '0.35s' }}>✧</span>
                      <span className="absolute -bottom-2 left-2/5 text-yellow-400 animate-pulse text-xs" style={{ animationDelay: '0.5s' }}>★</span>
                      <span className="absolute -bottom-3 left-1/2 text-yellow-300 animate-pulse text-lg" style={{ animationDelay: '0.65s' }}>✦</span>
                      <span className="absolute -bottom-2 left-3/5 text-yellow-400 animate-pulse text-sm" style={{ animationDelay: '0.8s' }}>✧</span>
                      <span className="absolute -bottom-3 right-1/4 text-yellow-300 animate-pulse text-base" style={{ animationDelay: '0.15s' }}>★</span>
                      <span className="absolute -bottom-2 right-1/6 text-yellow-400 animate-pulse text-xs" style={{ animationDelay: '0.3s' }}>✦</span>
                      <span className="absolute -bottom-3 -right-3 text-yellow-300 animate-pulse text-xl" style={{ animationDelay: '0.45s' }}>✧</span>
                    </>
                  )}
                  <p className="text-base font-medium text-gray-800 mb-1 leading-relaxed whitespace-pre-line">
                    {isTamil
                      ? kuralOfDay.kural_tamil?.replace(/\\n/g, '\n')
                      : kuralOfDay.kural_english?.replace(/\\n/g, '\n')}
                  </p>
                </div>
                {(kuralOfDay.audio_tamil_url || kuralOfDay.audio_english_url) && (
                  <button
                    onClick={() => {
                      if (audioPlaying && currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                        setAudioPlaying(false);
                        setCurrentAudio(null);
                      } else {
                        const audioUrl = isTamil
                          ? (kuralOfDay.audio_tamil_url || kuralOfDay.audio_english_url)
                          : (kuralOfDay.audio_english_url || kuralOfDay.audio_tamil_url);
                        if (audioUrl) {
                          const audio = new Audio(audioUrl);
                          audio.onended = () => {
                            setAudioPlaying(false);
                            setCurrentAudio(null);
                          };
                          audio.play();
                          setAudioPlaying(true);
                          setCurrentAudio(audio);
                        }
                      }
                    }}
                    className={`flex-shrink-0 p-2 rounded-full transition-colors ${audioPlaying ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-100 hover:bg-purple-200'}`}
                    title={isTamil ? (audioPlaying ? 'நிறுத்து' : 'ஒலி கேட்க') : (audioPlaying ? 'Stop' : 'Listen')}
                  >
                    <svg className={`h-5 w-5 ${audioPlaying ? 'text-white' : 'text-purple-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {audioPlaying ? (
                        <>
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </>
                      ) : (
                        <>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </>
                      )}
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {isTamil ? 'பொருள்' : 'Meaning'}
              </h3>
              <p className="text-sm text-gray-700">
                {isTamil ? kuralOfDay.meaning_tamil : kuralOfDay.meaning_english}
              </p>
            </div>

            {/* Video Mode */}
            {kuralMode === 'video' && (kuralOfDay.youtube_tamil_url || kuralOfDay.youtube_english_url) && (
              <div className="mt-3 flex justify-center">
                <div className="w-3/4 aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={isTamil ? (kuralOfDay.youtube_tamil_url || kuralOfDay.youtube_english_url || '') : (kuralOfDay.youtube_english_url || kuralOfDay.youtube_tamil_url || '')}
                    className="w-full h-full"
                    title={`${isTamil ? 'இன்றைய குறள்' : 'Kural of the Day'} - Thirukkural ${kuralOfDay.id} ${isTamil ? 'விளக்க வீடியோ' : 'explanation video'}`}
                    aria-label={`${isTamil ? 'திருக்குறள்' : 'Thirukkural'} ${kuralOfDay.id} ${isTamil ? 'வீடியோ' : 'video lesson'}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Game Mode - Live iframe embed */}
            {kuralMode === 'game' && (
              <div className="mt-3">
                {/* Game tab selector */}
                <div className="flex gap-2 mb-2">
                  {([
                    { id: 'puzzle', emoji: '🧩', en: 'Puzzle', ta: 'புதிர்' },
                    { id: 'flying', emoji: '🦋', en: 'Flying', ta: 'பறக்கும்' },
                    { id: 'balloon', emoji: '🎈', en: 'Balloon', ta: 'பலூன்' },
                    { id: 'race', emoji: '🏁', en: 'Race', ta: 'போட்டி' },
                  ] as const).map(g => (
                    <button
                      key={g.id}
                      onClick={() => { setSelectedHomeGame(g.id); setIframeLoading(true); }}
                      className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl text-xs font-semibold transition-all border-2 ${selectedHomeGame === g.id
                        ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/50'
                        }`}
                    >
                      <span className="text-xl mb-0.5">{g.emoji}</span>
                      <span>{isTamil ? g.ta : g.en}</span>
                    </button>
                  ))}
                </div>

                {/* iframe game embed */}
                <div className="relative rounded-xl overflow-hidden border-2 border-orange-200 bg-white shadow-md" style={{ height: 520 }}>
                  {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-orange-50 z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-orange-600 font-medium">
                          {isTamil ? 'விளையாட்டு ஏற்றுகிறது...' : 'Loading game...'}
                        </p>
                      </div>
                    </div>
                  )}
                  <iframe
                    key={selectedHomeGame}
                    src={`/kural-playing?game=${selectedHomeGame}&kural=${kuralOfDay.id}&embed=1`}
                    className="w-full h-full"
                    style={{ border: 'none' }}
                    title={`Kural ${selectedHomeGame} game`}
                    onLoad={() => setIframeLoading(false)}
                  />
                </div>

                {/* Open full screen link */}
                <div className="flex justify-end mt-2">
                  <Link
                    href={`/kural-playing?game=${selectedHomeGame}&kural=${kuralOfDay.id}`}
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800 font-medium transition"
                    target="_blank"
                  >
                    {isTamil ? 'முழுத்திரையில் திற' : 'Open full screen'}
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-3 text-center">
              <Link
                href={`/kural-learning/${kuralOfDay.slug}`}
                className="inline-flex items-center text-sm text-purple-700 hover:text-purple-900 font-medium"
              >
                {isTamil ? 'இந்தக் குறளைப் பற்றி மேலும் அறிக' : 'Learn more about this kural'}
                <svg className="ml-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <ExpandableSection
          title="What is Thirukkural?"
          titleTamil="திருக்குறள் என்றால் என்ன?"
          isTamil={isTamil}
          icon={<svg className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
          defaultOpen={false}
        >
          <p className="mb-4">
            {isTamil
              ? 'திருக்குறள் என்பது பழங்கால கவிஞரும் தத்துவஞானியுமான திருவள்ளுவரால் எழுதப்பட்ட 1,330 குறுகிய இருவரி பாடல்களைக் கொண்ட ஒரு செவ்வியல் தமிழ் நூலாகும். இதன் பெயர் "புனித இருவரிகள்" என்று பொருள்படும், மேலும் இது மனித சிந்தனையின் தலைசிறந்த படைப்பாகக் கருதப்படுகிறது.'
              : 'Thirukkural is a classic Tamil text that consists of 1,330 short couplets, or "kurals," written by the ancient poet and philosopher Thiruvalluvar. The name literally means "sacred couplets" and it\'s considered a masterpiece of human thought.'
            }
          </p>

          <p className="mb-4">
            {isTamil ? 'இந்நூல் மூன்று பிரிவுகளாகப் பிரிக்கப்பட்டுள்ளது:' : 'The text is divided into three books covering:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4">
            <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
              <div className="flex items-center mb-2 sm:mb-3">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                <h4 className="font-semibold text-green-800 text-sm sm:text-base">{isTamil ? 'அறம்' : 'Virtue (Aram)'}</h4>
              </div>
              <p className="text-xs sm:text-sm text-green-700">
                {isTamil ? 'நெறிமுறை நடத்தை மற்றும் நேர்மையான வாழ்க்கையைப் பற்றியது.' : 'Deals with ethical conduct and righteous living.'}
              </p>
            </div>

            <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center mb-2 sm:mb-3">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 mr-2" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                <h4 className="font-semibold text-yellow-800 text-sm sm:text-base">{isTamil ? 'பொருள்' : 'Wealth (Porul)'}</h4>
              </div>
              <p className="text-xs sm:text-sm text-yellow-700">
                {isTamil ? 'அரசாங்கம், பொருளாதாரம் மற்றும் சமூக வாழ்க்கையில் கவனம் செலுத்துகிறது.' : 'Focuses on governance, economics, and social life.'}
              </p>
            </div>

            <div className="bg-pink-50 p-4 sm:p-6 rounded-lg border border-pink-200 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-2 sm:mb-3">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                <h4 className="font-semibold text-pink-800 text-sm sm:text-base">{isTamil ? 'இன்பம்' : 'Love (Inbam)'}</h4>
              </div>
              <p className="text-xs sm:text-sm text-pink-700">
                {isTamil ? 'மனித உணர்வுகள், காதல் மற்றும் குடும்ப வாழ்க்கையின் சிக்கல்களை ஆராய்கிறது.' : 'Explores the complexities of human emotions, love, and domestic life.'}
              </p>
            </div>
          </div>

          <p>
            {isTamil
              ? 'ஒவ்வொரு குறளும் ஆழமான ஞானத்தை உள்ளடக்கிய ஏழு சொற்கள் கொண்ட சுருக்கமான இருவரிப் பாடலாகும், எளிதில் நினைவில் கொள்ளக்கூடியதாகவும் தாக்கத்தை ஏற்படுத்துவதாகவும் உள்ளது.'
              : 'Each kural is a concise, seven-word couplet that encapsulates profound wisdom, making it easily memorable and impactful.'
            }
          </p>
        </ExpandableSection>

        <ExpandableSection
          title="How Old is Thirukkural?"
          titleTamil="திருக்குறள் எவ்வளவு பழமையானது?"
          isTamil={isTamil}
          icon={<svg className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
        >
          <p className="mb-4">
            {isTamil
              ? 'திருக்குறள் கி.மு. 31 ஆம் ஆண்டில் வாழ்ந்ததாக நம்பப்படும் பழங்கால கவிஞரும் தத்துவஞானியுமான திருவள்ளுவருக்கு காரணமாகக் கூறப்படுகிறது.'
              : 'The Thirukkural is attributed to the ancient poet and philosopher Thiruvalluvar, who is believed to have lived around 31 BCE.'
            }
          </p>
        </ExpandableSection>

        <ExpandableSection
          title="How it Helps for Life"
          titleTamil="வாழ்க்கைக்கு எவ்வாறு உதவுகிறது"
          isTamil={isTamil}
          icon={<svg className="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>}
        >
          <p className="mb-4">
            {isTamil
              ? 'திருக்குறள் ஒரு புத்திசாலி பழைய நண்பர் போன்றது, இன்றும் கூட மகிழ்ச்சியான மற்றும் நியாயமான வாழ்க்கை வாழ நல்ல ஆலோசனைகளை வழங்குகிறது!'
              : 'Thirukkural is like a wise old friend that gives us good advice for living a happy and fair life, even today! Here\'s how it helps:'
            }
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 text-sm sm:text-base">
                {isTamil ? 'நல்ல மனிதராக இருங்கள்' : 'Be a Good Person'}
              </h4>
              <p className="text-blue-700 text-xs sm:text-sm">
                {isTamil
                  ? 'நேர்மையாகவும், கருணையுடனும், எப்போதும் சரியானதைச் செய்யவும் இது நமக்குக் கற்பிக்கிறது.'
                  : 'It teaches us to be honest, kind, and to always do the right thing. It\'s like a guide for being a good friend, a good family member, and a good person in general.'
                }
              </p>
            </div>

            <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">
                {isTamil ? 'நல்ல தலைவராக இருங்கள்' : 'Be a Good Leader'}
              </h4>
              <p className="text-green-700 text-xs sm:text-sm">
                {isTamil
                  ? 'பெற்றோர், ஆசிரியர்கள் அல்லது எதிர்கால தலைவர்கள் போன்ற தலைவர்களுக்கு புத்திசாலித்தனமான யோசனைகளைக் கொண்டுள்ளது!'
                  : 'It has smart ideas for leaders, like parents, teachers, or even future presidents! It teaches them how to be fair and make good decisions for everyone.'
                }
              </p>
            </div>

            <div className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 sm:mb-3 text-sm sm:text-base">
                {isTamil ? 'மகிழ்ச்சியான உறவுகளைப் பெறுங்கள்' : 'Have Happy Relationships'}
              </h4>
              <p className="text-purple-700 text-xs sm:text-sm">
                {isTamil
                  ? 'நம் குடும்பத்தினரையும் நண்பர்களையும் அன்புடனும் மரியாதையுடனும் நடத்துவது எப்படி என்று காட்டுகிறது.'
                  : 'It shows us how to treat our family and friends with love and respect. It helps us understand how to forgive and build strong, happy connections with others.'
                }
              </p>
            </div>

            <div className="bg-orange-50 p-4 sm:p-6 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2 sm:mb-3 text-sm sm:text-base">
                {isTamil ? 'உங்கள் மனதை மகிழ்ச்சியாக வைத்திருங்கள்' : 'Keep Your Mind Happy'}
              </h4>
              <p className="text-orange-700 text-xs sm:text-sm">
                {isTamil
                  ? 'நல்ல எண்ணங்கள் நிறைந்த "நல்ல மனம்" பற்றி பேசுகிறது. இது நம்மை உள்ளே அமைதியாகவும் மகிழ்ச்சியாகவும் உணர உதவுகிறது.'
                  : 'It talks about having a "good mind" that is full of good thoughts and no bad ones. This helps us feel calm and happy inside.'
                }
              </p>
            </div>
          </div>
        </ExpandableSection>

        <div className="text-center mt-8 sm:mt-12">
          <div className="bg-gradient-to-br from-purple-800 via-purple-600 to-violet-500 text-white rounded-lg py-6 sm:py-8 px-4 sm:px-6">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">
              {isTamil ? 'உங்கள் பயணத்தைத் தொடங்க தயாரா?' : 'Ready to Start Your Journey?'}
            </h3>
            <p className="text-sm sm:text-base mb-4 opacity-90">
              {isTamil
                ? 'எங்கள் ஊடாடும் கற்றல் தளத்தின் மூலம் திருக்குறளின் காலத்தால் அழியாத ஞானத்தைக் கண்டறியுங்கள்'
                : 'Discover the timeless wisdom of Thirukkural through our interactive learning platform'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href={`/kural-learning/${firstKuralSlug}`}
                className="inline-flex items-center text-sm px-4 py-2 bg-amber-100 text-purple-800 hover:bg-amber-200 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                {isTamil ? 'இப்போது கற்கத் தொடங்குங்கள்' : 'Begin Learning Now'}
              </Link>
              <Link
                href="/kural-playing"
                className="inline-flex items-center text-sm px-4 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                {isTamil ? 'விளையாடிக் கற்க' : 'Learn by Playing'}
              </Link>
            </div>
          </div>
        </div>
      </main >

      {/* Navigation Modal */}
      < NavigationModal
        isOpen={showNavModal}
        onClose={() => setShowNavModal(false)
        }
        allKuralSlugs={allKuralSlugs as NavKuralSlugMap[]}
        language={isTamil ? 'tamil' : 'english'}
        visitedKurals={visitedKurals}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        totalKurals={totalKurals}
      />

      {/* Badge Modal */}
      < BadgeModal
        isOpen={showBadgeModal}
        onClose={() => {
          setShowBadgeModal(false);
          setCelebrationType(null);
        }}
        language={isTamil ? 'tamil' : 'english'}
        celebrationType={celebrationType}
      />

      {/* Auth Modal */}
      < AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isTamil={isTamil}
      />

      {/* Pricing Modal */}
      < PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        isTamil={isTamil}
      />
    </>
  );
}
