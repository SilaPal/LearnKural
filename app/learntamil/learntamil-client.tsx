'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { letterCategories, TamilLetter, LetterCategory, meiBaseLetters, uyirMarkers } from '@/lib/tamil-letters';

// Group uyirmei letters by their mei consonant series
const groupUyirmeiByMei = (letters: TamilLetter[]) => {
  const groups: { mei: typeof meiBaseLetters[0]; letters: TamilLetter[] }[] = [];
  
  meiBaseLetters.forEach(mei => {
    const seriesLetters = letters.filter(l => l.id.startsWith(`uyirmei-${mei.name}-`));
    if (seriesLetters.length > 0) {
      groups.push({ mei, letters: seriesLetters });
    }
  });
  
  return groups;
};

interface Badge {
  categoryId: string;
  earnedAt: number;
}

export default function LearnTamilClient() {
  const [isTamil, setIsTamil] = useState(false);
  const [completedLetters, setCompletedLetters] = useState<string[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'practice'>('practice');

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    }

    const savedCompleted = localStorage.getItem('learntamil-completed');
    if (savedCompleted) {
      try {
        setCompletedLetters(JSON.parse(savedCompleted));
      } catch {}
    }

    const savedBadges = localStorage.getItem('learntamil-badges');
    if (savedBadges) {
      try {
        setBadges(JSON.parse(savedBadges));
      } catch {}
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = !isTamil;
    setIsTamil(newLang);
    localStorage.setItem('thirukural-language', newLang ? 'tamil' : 'english');
  };

  const getCategoryProgress = (category: LetterCategory) => {
    const completed = category.letters.filter(l => completedLetters.includes(l.id)).length;
    return { completed, total: category.letters.length };
  };

  const hasBadge = (categoryId: string) => badges.some(b => b.categoryId === categoryId);

  // Get uyirmei formula components from letter id
  const getUyirmeiFormula = (letterId: string) => {
    if (!letterId.startsWith('uyirmei-')) return null;
    const parts = letterId.replace('uyirmei-', '').split('-');
    if (parts.length !== 2) return null;
    const [meiName, uyirName] = parts;
    const mei = meiBaseLetters.find(m => m.name === meiName);
    const uyir = uyirMarkers.find(u => u.name === uyirName);
    if (!mei || !uyir) return null;
    return { mei: mei.mei, uyir: uyir.uyir };
  };

  return (
    <>
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="p-2 hover:bg-white/20 rounded-full transition">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>✍️</span>
              {isTamil ? 'தமிழ் எழுத்துக்கள்' : 'Tamil Letters'}
            </h1>
            <div className="w-10" />
          </div>
          <p className="text-sm opacity-90 text-center mb-3">
            {isTamil ? 'எழுத்துக்களை எழுதக் கற்றுக்கொள்ளுங்கள்' : 'Learn to write Tamil Letters'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {isTamil ? 'English' : 'தமிழ்'}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowProgress(!showProgress)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
                title={isTamil ? 'முன்னேற்றம்' : 'Progress'}
              >
                <span className="text-xl">🏆</span>
              </button>
              {showProgress && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl p-4 z-50">
                  <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
                    <span>🏆</span>
                    {isTamil ? 'உங்கள் முன்னேற்றம்' : 'Your Progress'}
                  </h3>
                  <div className="space-y-2">
                    {letterCategories.map(category => {
                      const progress = getCategoryProgress(category);
                      const hasEarned = hasBadge(category.id);
                      const percent = (progress.completed / progress.total) * 100;
                      return (
                        <div key={category.id} className="text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-medium ${hasEarned ? 'text-amber-600' : 'text-gray-700'}`}>
                              {hasEarned && '🎖️ '}
                              {isTamil ? category.nameTamil : category.name}
                            </span>
                            <span className="text-gray-500">
                              {progress.completed}/{progress.total}
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${hasEarned ? 'bg-amber-500' : 'bg-orange-400'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {showProgress && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProgress(false)}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs - Modern Toggle Style */}
        <div className="bg-gray-100 p-1.5 rounded-full inline-flex mx-auto mb-8 w-full max-w-xs">
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-3 px-4 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'practice'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>✏️</span>
            {isTamil ? 'எழுது' : 'Write'}
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 py-3 px-4 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'games'
                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>🎮</span>
            {isTamil ? 'விளையாடு' : 'Play'}
          </button>
        </div>

        {/* Games Tab Content - Gaming Aesthetic */}
        {activeTab === 'games' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Link
                href="/learntamil/quiz"
                className="group relative p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl text-white overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-500/20"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">🧩</div>
                  <h3 className="font-extrabold text-xl mb-1">{isTamil ? 'உயிர்மெய் Quiz' : 'Uyirmei Quiz'}</h3>
                  <p className="text-sm text-white/80">
                    {isTamil ? 'எழுத்து combo கண்டுபிடி!' : 'Find the letter combo!'}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full">
                    <span>🏆</span> {isTamil ? 'சவால்' : 'Challenge'}
                  </div>
                </div>
              </Link>
              <Link
                href="/learntamil/games/memory"
                className="group relative p-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl text-white overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl shadow-teal-500/20"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">🃏</div>
                  <h3 className="font-extrabold text-xl mb-1">{isTamil ? 'Memory Match' : 'Memory Match'}</h3>
                  <p className="text-sm text-white/80">
                    {isTamil ? 'ஜோடி கண்டுபிடி!' : 'Find the pairs!'}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full">
                    <span>🧠</span> {isTamil ? 'நினைவாற்றல்' : 'Brain Power'}
                  </div>
                </div>
              </Link>
              <Link
                href="/learntamil/games/balloon"
                className="group relative p-6 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 rounded-3xl text-white overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl shadow-pink-500/20"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">🎈</div>
                  <h3 className="font-extrabold text-xl mb-1">{isTamil ? 'Letter Pop' : 'Letter Pop'}</h3>
                  <p className="text-sm text-white/80">
                    {isTamil ? 'சரியான எழுத்தை உடை!' : 'Pop the right one!'}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full">
                    <span>⚡</span> {isTamil ? 'வேகம்' : 'Speed'}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Practice Tab Content */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* Category Selection - Circle Icons */}
            <div className="flex justify-center gap-6 mb-4">
              {letterCategories.map(category => {
                const progress = getCategoryProgress(category);
                const isSelected = expandedCategory === category.id;
                const progressPercent = (progress.completed / progress.total) * 100;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setExpandedCategory(isSelected ? null : category.id)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isSelected 
                        ? `bg-gradient-to-br ${category.color} shadow-xl scale-110 ring-4 ring-white ring-offset-2`
                        : 'bg-white shadow-lg hover:scale-105 hover:shadow-xl'
                    }`}>
                      {/* Progress ring */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke={isSelected ? 'rgba(255,255,255,0.3)' : '#e5e7eb'}
                          strokeWidth="4"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke={isSelected ? 'white' : '#f97316'}
                          strokeWidth="4"
                          strokeDasharray={`${progressPercent * 2.83} 283`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={`text-4xl sm:text-5xl z-10 ${isSelected ? '' : 'group-hover:scale-110 transition-transform'}`}>
                        {category.icon}
                      </span>
                      {hasBadge(category.id) && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs shadow-md">
                          🎖️
                        </div>
                      )}
                    </div>
                    <span className={`text-sm font-bold text-center transition-colors ${
                      isSelected ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {isTamil ? category.nameTamil.split(' ')[0] : category.name.split(' ')[0]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {progress.completed}/{progress.total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Category Letters */}
            {expandedCategory && (
              <div className="bg-white rounded-3xl shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {letterCategories.filter(c => c.id === expandedCategory).map(category => (
                  <div key={category.id}>
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {isTamil ? category.nameTamil : category.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {isTamil ? 'எழுத்தை தேர்ந்தெடுக்கவும்' : 'Select a letter to practice'}
                      </p>
                    </div>
                    {category.id === 'uyirmei' ? (
                      <div className="space-y-6">
                        {groupUyirmeiByMei(category.letters).map((group, groupIndex) => {
                          const seriesCompleted = group.letters.filter(l => completedLetters.includes(l.id)).length;
                          const seriesTotal = group.letters.length;
                          return (
                            <div key={group.mei.name}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-md">
                                  <span className="text-white text-xl font-bold">{group.mei.base}</span>
                                  <span className="text-white/80 text-sm">
                                    {isTamil ? `${group.mei.base} வரிசை` : `${group.mei.name.toUpperCase()} Series`}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400">{seriesCompleted}/{seriesTotal}</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-teal-200 to-transparent"></div>
                              </div>
                              <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
                                {group.letters.map(letter => {
                                  const isCompleted = completedLetters.includes(letter.id);
                                  const formula = getUyirmeiFormula(letter.id);
                                  return (
                                    <Link
                                      key={letter.id}
                                      href={`/learntamil/letter/${letter.id}`}
                                      className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 shadow-md ${
                                        isCompleted 
                                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-green-200' 
                                          : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-teal-50 hover:to-emerald-100 hover:shadow-teal-200'
                                      }`}
                                    >
                                      <span className="text-2xl sm:text-3xl font-bold">{letter.letter}</span>
                                      {formula && (
                                        <div className={`text-xs flex items-center gap-1 ${isCompleted ? 'text-white/80' : 'text-gray-500'}`}>
                                          <span>{formula.mei}</span>
                                          <span>+</span>
                                          <span>{formula.uyir}</span>
                                          <span>=</span>
                                          <span className="font-bold">{letter.letter}</span>
                                        </div>
                                      )}
                                      {isCompleted && (
                                        <span className="text-xs mt-1">✓</span>
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid gap-3 grid-cols-4 sm:grid-cols-6 md:grid-cols-8">
                        {category.letters.map(letter => {
                          const isCompleted = completedLetters.includes(letter.id);
                          return (
                            <Link
                              key={letter.id}
                              href={`/learntamil/letter/${letter.id}`}
                              className={`aspect-square rounded-full flex flex-col items-center justify-center transition-all duration-200 hover:scale-110 shadow-md ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-green-200' 
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-orange-100 hover:to-red-100 hover:shadow-orange-200'
                              }`}
                            >
                              <span className="text-2xl sm:text-3xl font-bold">{letter.letter}</span>
                              {isCompleted && (
                                <span className="text-xs">✓</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Prompt when no category selected */}
            {!expandedCategory && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">👆</div>
                <p>{isTamil ? 'மேலே உள்ள வட்டத்தை தட்டவும்' : 'Tap a circle above to start'}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
