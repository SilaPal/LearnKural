'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllBadges, getMasteredCount, getStreakData, getSkillStats, Badge, SkillStats } from '@/lib/badge-system';

export default function KuralProgressClient() {
  const [isTamil, setIsTamil] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [skillStats, setSkillStats] = useState<SkillStats | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalKuralsViewed, setTotalKuralsViewed] = useState(0);

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    }

    setMasteredCount(getMasteredCount());
    setBadges(getAllBadges());
    setStreakData(getStreakData());
    setSkillStats(getSkillStats());

    const points = parseInt(localStorage.getItem('thirukural-total-points') || '0', 10);
    setTotalPoints(points);

    const kuralActivities = JSON.parse(localStorage.getItem('thirukural-kural-activities') || '{}');
    setTotalKuralsViewed(Object.keys(kuralActivities).length);
  }, []);

  const toggleLanguage = () => {
    const newLang = !isTamil;
    setIsTamil(newLang);
    localStorage.setItem('thirukural-language', newLang ? 'tamil' : 'english');
  };

  const badgesByCategory = {
    skill: badges.filter(b => b.category === 'skill'),
    mastery: badges.filter(b => b.category === 'mastery'),
    streak: badges.filter(b => b.category === 'streak'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="font-semibold">{isTamil ? 'முகப்பு' : 'Home'}</span>
          </Link>
          <h1 className="text-xl font-bold">{isTamil ? '📊 எனது முன்னேற்றம்' : '📊 My Progress'}</h1>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            {isTamil ? 'English' : 'தமிழ்'}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-3xl font-bold text-orange-600">{masteredCount}</div>
            <div className="text-gray-600 text-sm">{isTamil ? 'தேர்ச்சி பெற்ற குறள்கள்' : 'Kurals Mastered'}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-amber-600">{totalPoints}</div>
            <div className="text-gray-600 text-sm">{isTamil ? 'மொத்த புள்ளிகள்' : 'Total Points'}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-bold text-red-500">{streakData.currentStreak}</div>
            <div className="text-gray-600 text-sm">{isTamil ? 'தினசரி தொடர்' : 'Day Streak'}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">📚</span>
            {isTamil ? 'கற்றல் நிலை' : 'Learning Stats'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{isTamil ? 'பார்த்த குறள்கள்' : 'Kurals Viewed'}</span>
              <span className="font-bold text-gray-800">{totalKuralsViewed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{isTamil ? 'அதிகபட்ச தொடர்' : 'Longest Streak'}</span>
              <span className="font-bold text-gray-800">{streakData.longestStreak} {isTamil ? 'நாட்கள்' : 'days'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{isTamil ? 'சிறந்த உச்சரிப்புகள்' : 'Perfect Pronunciations'}</span>
              <span className="font-bold text-gray-800">{skillStats?.perfectPronunciations || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{isTamil ? 'பேட்ஜ்கள்' : 'Badges Earned'}</span>
              <span className="font-bold text-gray-800">{badges.length}</span>
            </div>
          </div>
        </div>

        {skillStats && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">🎮</span>
              {isTamil ? 'விளையாட்டு சாதனைகள்' : 'Game Achievements'}
            </h2>
            <div className="space-y-3">
              {skillStats.puzzleFastestTime && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧩</span>
                    <span className="text-gray-700">{isTamil ? 'புதிர் வேகமான நேரம்' : 'Puzzle Fastest Time'}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">{skillStats.puzzleFastestTime}s</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏎️</span>
                  <span className="text-gray-700">{isTamil ? 'பந்தய வெற்றித் தொடர்' : 'Race Win Streak'}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700">{skillStats.maxRaceWinStreak}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎤</span>
                  <span className="text-gray-700">{isTamil ? 'சிறந்த உச்சரிப்புகள்' : 'Perfect Pronunciations'}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700">{skillStats.perfectPronunciations}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-pink-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎈</span>
                  <span className="text-gray-700">{isTamil ? 'பலூன் சிறப்பு விளையாட்டுகள்' : 'Balloon Perfect Games'}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-pink-100 text-pink-700">{skillStats.balloonPerfectGames}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🦅</span>
                  <span className="text-gray-700">{isTamil ? 'பறக்கும் சிறப்பு விளையாட்டுகள்' : 'Flying Perfect Games'}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">{skillStats.flyingPerfectGames}</span>
              </div>
            </div>
          </div>
        )}

        {badges.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">🏅</span>
              {isTamil ? 'சாதனை பேட்ஜ்கள்' : 'Earned Badges'}
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  title={badge.description}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
