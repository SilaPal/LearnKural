'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface KuralSlugMap {
  id: number;
  slug: string;
  kural_tamil?: string;
  kural_english?: string;
  audio_tamil_url?: string;
  audio_english_url?: string;
  section_tamil?: string;
  section_english?: string;
  subsection_tamil?: string;
  subsection_english?: string;
}

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  allKuralSlugs: KuralSlugMap[];
  currentKuralId?: number;
  language: 'tamil' | 'english';
  visitedKurals: number[];
  bookmarks: number[];
  onToggleBookmark: (kuralId: number) => void;
  totalKurals: number;
}

export function NavigationModal({
  isOpen,
  onClose,
  allKuralSlugs,
  currentKuralId,
  language,
  visitedKurals,
  bookmarks,
  onToggleBookmark,
  totalKurals,
}: NavigationModalProps) {
  const [navTab, setNavTab] = useState<'sections' | 'progress' | 'bookmarks'>('progress');
  const [sectionLang, setSectionLang] = useState<'english' | 'tamil'>('english');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const [favoriteAudio, setFavoriteAudio] = useState<HTMLAudioElement | null>(null);
  const [playingFavoriteId, setPlayingFavoriteId] = useState<number | null>(null);

  const isTamil = language === 'tamil';

  const playFavoriteAudio = (kuralInfo: KuralSlugMap) => {
    const audioUrl = isTamil ? kuralInfo.audio_tamil_url : kuralInfo.audio_english_url;
    if (!audioUrl) return;
    
    if (favoriteAudio) {
      favoriteAudio.pause();
    }
    
    const audio = new Audio(audioUrl);
    setFavoriteAudio(audio);
    setPlayingFavoriteId(kuralInfo.id);
    
    audio.play().catch(() => {});
    audio.onended = () => {
      setPlayingFavoriteId(null);
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {isTamil ? '📊 வழிசெலுத்தல்' : '📊 Navigation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setNavTab('sections')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              navTab === 'sections' 
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🗂️ {isTamil ? 'பிரிவுகள்' : 'Sections'}
          </button>
          <button
            onClick={() => setNavTab('progress')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              navTab === 'progress' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔥 {visitedKurals.length}/{totalKurals}
          </button>
          <button
            onClick={() => setNavTab('bookmarks')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              navTab === 'bookmarks' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ❤️ {bookmarks.length}
          </button>
        </div>

        {navTab === 'progress' && (
          <div>
            <div className="flex gap-4 text-sm mb-3">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-green-500"></span>
                {isTamil ? 'பார்த்தது' : 'Visited'}
              </span>
              {currentKuralId !== undefined && (
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-purple-600"></span>
                  {isTamil ? 'தற்போதைய' : 'Current'}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-gray-300"></span>
                {isTamil ? 'பார்க்கவில்லை' : 'Not visited'}
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-64 overflow-y-auto">
              {(allKuralSlugs || []).map((k) => {
                const isCurrent = currentKuralId !== undefined && k.id === currentKuralId;
                const isVisited = visitedKurals.includes(k.id);
                const isBookmarked = bookmarks.includes(k.id);
                return (
                  <div
                    key={k.id}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-lg transition ${
                      isCurrent
                        ? 'bg-purple-100'
                        : isVisited 
                          ? 'bg-green-100' 
                          : 'bg-gray-100'
                    }`}
                  >
                    <Link
                      href={`/kural-learning/${k.slug}`}
                      onClick={onClose}
                      className={`w-6 h-6 flex items-center justify-center text-xs rounded transition hover:scale-110 ${
                        isCurrent 
                          ? 'bg-purple-600 text-white font-bold' 
                          : isVisited 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                      }`}
                      title={`Kural ${k.id}`}
                    >
                      {k.id}
                    </Link>
                    <button
                      onClick={() => onToggleBookmark(k.id)}
                      className="text-sm hover:scale-125 transition"
                      title={isBookmarked ? (isTamil ? 'நீக்கு' : 'Remove') : (isTamil ? 'சேர்' : 'Add')}
                    >
                      {isBookmarked ? '❤️' : '🤍'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {navTab === 'sections' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {sectionLang === 'tamil' ? 'தமிழில் பிரிவுகளைக் காண்க' : 'Browse sections in English'}
              </p>
              <button
                onClick={() => {
                  setSectionLang(sectionLang === 'english' ? 'tamil' : 'english');
                  setExpandedSections(new Set());
                  setExpandedSubsections(new Set());
                }}
                className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full hover:opacity-90 transition flex items-center gap-1"
              >
                🌐 {sectionLang === 'english' ? 'தமிழ்' : 'English'}
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(() => {
                const sections = new Map<string, Map<string, KuralSlugMap[]>>();
                (allKuralSlugs || []).forEach(k => {
                  const section = sectionLang === 'tamil' 
                    ? (k.section_tamil || 'மற்றவை')
                    : (k.section_english || 'Other');
                  const subsection = sectionLang === 'tamil'
                    ? (k.subsection_tamil || 'மற்றவை')
                    : (k.subsection_english || 'Other');
                  
                  if (!sections.has(section)) {
                    sections.set(section, new Map());
                  }
                  const sectionMap = sections.get(section)!;
                  if (!sectionMap.has(subsection)) {
                    sectionMap.set(subsection, []);
                  }
                  sectionMap.get(subsection)!.push(k);
                });

                const sectionColors = [
                  'from-purple-500 to-indigo-500',
                  'from-orange-500 to-red-500', 
                  'from-green-500 to-teal-500',
                  'from-pink-500 to-rose-500',
                  'from-blue-500 to-cyan-500',
                  'from-yellow-500 to-orange-500',
                ];

                return Array.from(sections.entries()).map(([sectionName, subsections], sectionIdx) => {
                  const isSectionExpanded = expandedSections.has(sectionName);
                  const colorClass = sectionColors[sectionIdx % sectionColors.length];
                  const totalKuralsInSection = Array.from(subsections.values()).reduce((sum, arr) => sum + arr.length, 0);
                  
                  return (
                    <div key={sectionName} className="rounded-xl overflow-hidden border border-gray-200">
                      <button
                        onClick={() => {
                          const newSet = new Set(expandedSections);
                          if (isSectionExpanded) {
                            newSet.delete(sectionName);
                          } else {
                            newSet.add(sectionName);
                          }
                          setExpandedSections(newSet);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${colorClass} text-white font-medium hover:opacity-90 transition`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{isSectionExpanded ? '📂' : '📁'}</span>
                          <span>{sectionName}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{totalKuralsInSection}</span>
                          <span className="text-lg">{isSectionExpanded ? '▼' : '▶'}</span>
                        </span>
                      </button>
                      
                      {isSectionExpanded && (
                        <div className="bg-gray-50 p-2 space-y-1">
                          {Array.from(subsections.entries()).map(([subsectionName, kuralsInSubsection]) => {
                            const subsectionKey = `${sectionName}-${subsectionName}`;
                            const isSubsectionExpanded = expandedSubsections.has(subsectionKey);
                            
                            return (
                              <div key={subsectionKey} className="rounded-lg overflow-hidden">
                                <button
                                  onClick={() => {
                                    const newSet = new Set(expandedSubsections);
                                    if (isSubsectionExpanded) {
                                      newSet.delete(subsectionKey);
                                    } else {
                                      newSet.add(subsectionKey);
                                    }
                                    setExpandedSubsections(newSet);
                                  }}
                                  className="w-full px-3 py-2 flex items-center justify-between bg-white hover:bg-gray-100 transition text-left"
                                >
                                  <span className="flex items-center gap-2 text-gray-700">
                                    <span>{isSubsectionExpanded ? '📖' : '📕'}</span>
                                    <span className="text-sm font-medium">{subsectionName}</span>
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs text-gray-600">{kuralsInSubsection.length}</span>
                                    <span className="text-gray-400">{isSubsectionExpanded ? '▼' : '▶'}</span>
                                  </span>
                                </button>
                                
                                {isSubsectionExpanded && (
                                  <div className="bg-white border-t border-gray-100 p-2">
                                    <div className="flex flex-wrap gap-1">
                                      {kuralsInSubsection.map(k => {
                                        const isCurrent = currentKuralId !== undefined && k.id === currentKuralId;
                                        const isVisited = visitedKurals.includes(k.id);
                                        const isBookmarked = bookmarks.includes(k.id);
                                        return (
                                          <div key={k.id} className="relative group">
                                            <Link
                                              href={`/kural-learning/${k.slug}`}
                                              onClick={onClose}
                                              className={`w-10 h-10 flex items-center justify-center text-xs rounded-lg transition hover:scale-105 ${
                                                isCurrent 
                                                  ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-300' 
                                                  : isVisited 
                                                    ? 'bg-green-500 text-white' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                              }`}
                                              title={`Kural ${k.id}`}
                                            >
                                              {k.id}
                                            </Link>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleBookmark(k.id);
                                              }}
                                              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] bg-white rounded-full shadow-sm border border-gray-200 hover:scale-125 transition"
                                              title={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                              {isBookmarked ? '❤️' : '🤍'}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {navTab === 'bookmarks' && (
          <div>
            {bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">💔</span>
                <p className="text-gray-600">
                  {isTamil 
                    ? 'பிடித்த குறள்கள் இல்லை. ❤️ பொத்தானைக் கிளிக் செய்து சேமியுங்கள்!'
                    : 'No favorites yet. Click the ❤️ button to save kurals!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bookmarks.sort((a, b) => a - b).map((id) => {
                  const kuralInfo = (allKuralSlugs || []).find(k => k.id === id);
                  if (!kuralInfo) return null;
                  const kuralText = isTamil ? kuralInfo.kural_tamil : kuralInfo.kural_english;
                  const hasAudio = isTamil ? kuralInfo.audio_tamil_url : kuralInfo.audio_english_url;
                  const isPlaying = playingFavoriteId === id;
                  
                  return (
                    <div key={id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100 hover:shadow-md transition">
                      <span className="text-red-500 font-bold text-lg min-w-8">#{id}</span>
                      <div className="flex-1">
                        <p className="text-gray-700 text-sm whitespace-pre-line line-clamp-2">
                          {kuralText?.replace(/\\n/g, '\n')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasAudio && (
                          <button
                            onClick={() => playFavoriteAudio(kuralInfo)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                              isPlaying 
                                ? 'bg-purple-500 text-white animate-pulse' 
                                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            }`}
                            title={isTamil ? 'ஒலிக்க' : 'Play audio'}
                          >
                            {isPlaying ? (
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5,3 19,12 5,21" />
                              </svg>
                            )}
                          </button>
                        )}
                        <Link
                          href={`/kural-learning/${kuralInfo.slug}`}
                          onClick={onClose}
                          className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition"
                          title={isTamil ? 'கற்க' : 'Learn'}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
