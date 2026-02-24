'use client';

import { useState, useEffect } from 'react';
import { 
  Badge, 
  getAllBadges, 
  getBadgesByCategory, 
  getKuralProgress, 
  getStreakData, 
  getSkillStats,
  getMasteredCount,
  markBadgesViewed,
  MASTERY_BADGES,
  STREAK_BADGES,
  SKILL_BADGES
} from '@/lib/badge-system';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: 'tamil' | 'english';
  celebrationType: 'confetti' | 'fireworks' | 'stars' | 'balloons' | 'sparkles' | 'snow' | 'golden' | null;
}

export default function BadgeModal({ isOpen, onClose, language, celebrationType }: Props) {
  const [activeTab, setActiveTab] = useState<'mastery' | 'streak' | 'skill'>('mastery');
  const [badges, setBadges] = useState<{ mastery: Badge[]; streak: Badge[]; skill: Badge[] }>({ mastery: [], streak: [], skill: [] });
  const [masteredCount, setMasteredCount] = useState(0);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalDays: 0 });
  const [skillStats, setSkillStats] = useState({ puzzleFastestTime: null as number | null, maxRaceWinStreak: 0 });

  useEffect(() => {
    if (isOpen) {
      const byCategory = getBadgesByCategory();
      setBadges(byCategory);
      setMasteredCount(getMasteredCount());
      const streak = getStreakData();
      setStreakData({ currentStreak: streak.currentStreak, longestStreak: streak.longestStreak, totalDays: streak.totalDays });
      const skills = getSkillStats();
      setSkillStats({ puzzleFastestTime: skills.puzzleFastestTime, maxRaceWinStreak: skills.maxRaceWinStreak });
      markBadgesViewed();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalBadges = badges.mastery.length + badges.streak.length + badges.skill.length;
  const masteryMilestones = Object.keys(MASTERY_BADGES).map(Number);
  const streakMilestones = Object.keys(STREAK_BADGES).map(Number);
  const skillKeys = Object.keys(SKILL_BADGES);

  const renderProgressRing = (progress: number, total: number, color: string) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(progress / total, 1);
    const offset = circumference * (1 - percent);
    
    return (
      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="w-28 h-28 progress-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="6" />
          <circle 
            cx="50" cy="50" r={radius} 
            fill="none" 
            stroke={color} 
            strokeWidth="6" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-amber-800 font-bold text-lg">{progress}/{total}</span>
        </div>
      </div>
    );
  };

  const renderBadgeCard = (badge: Badge, index: number) => {
    const tierColors = {
      bronze: 'from-amber-700 to-amber-900 border-amber-500',
      silver: 'from-gray-400 to-gray-600 border-gray-300',
      gold: 'from-yellow-400 to-amber-500 border-yellow-300 neon-glow-gold',
      diamond: 'from-cyan-300 to-blue-400 border-cyan-200 holographic'
    };

    return (
      <div 
        key={badge.id}
        className={`relative p-4 rounded-xl bg-gradient-to-br ${tierColors[badge.tier]} border-2 animate-badge-entrance transform hover:scale-105 transition-all duration-300`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {!badge.viewed && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
        <div className="text-4xl mb-2 text-center neon-pulse">{badge.icon}</div>
        <div className="text-center">
          <div className="font-bold text-white text-shadow text-sm">
            {language === 'tamil' ? badge.nameTamil : badge.name}
          </div>
          <div className="text-xs text-white/70 mt-1">
            {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
          </div>
        </div>
      </div>
    );
  };

  const renderLockedBadge = (info: { name: string; nameTamil: string; icon: string; tier: Badge['tier'] }, key: string, index: number) => {
    return (
      <div 
        key={key}
        className="relative p-4 rounded-xl bg-amber-100/50 border-2 border-amber-200 opacity-60"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="text-4xl mb-2 text-center grayscale">{info.icon}</div>
        <div className="text-center">
          <div className="font-semibold text-amber-600 text-sm">
            {language === 'tamil' ? info.nameTamil : info.name}
          </div>
          <div className="text-xs text-amber-500 mt-1">🔒 Locked</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border-2 border-amber-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with warm gradient */}
        <div className="relative bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div>
                <h2 className="text-2xl font-bold text-white drop-shadow-md">
                  {language === 'tamil' ? 'சாதனை பேட்ஜ்கள்' : 'Achievement Badges'}
                </h2>
                <p className="text-sm text-white/90">
                  {language === 'tamil' 
                    ? `${totalBadges} பேட்ஜ்கள் பெறப்பட்டன`
                    : `${totalBadges} badges earned`}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center text-white transition-all shadow-md"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-amber-200 bg-white/50">
          {(['mastery', 'streak', 'skill'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-2 text-center font-semibold transition-all ${
                activeTab === tab 
                  ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50' 
                  : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50/50'
              }`}
            >
              <span className="text-xl mr-2">
                {tab === 'mastery' ? '🎓' : tab === 'streak' ? '🔥' : '⭐'}
              </span>
              <span className="hidden sm:inline">
                {language === 'tamil' 
                  ? (tab === 'mastery' ? 'குறள் தேர்ச்சி' : tab === 'streak' ? 'தொடர்' : 'திறன்')
                  : (tab === 'mastery' ? 'Mastery' : tab === 'streak' ? 'Streak' : 'Skill')}
              </span>
              {badges[tab].length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {badges[tab].length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Stats Section */}
          <div className="flex justify-center gap-6 mb-6">
            {activeTab === 'mastery' && (
              <div className="text-center">
                {renderProgressRing(masteredCount, 1330, '#f59e0b')}
                <p className="text-amber-700 text-sm mt-2 font-medium">
                  {language === 'tamil' ? 'தேர்ச்சி பெற்றவை' : 'Kurals Mastered'}
                </p>
              </div>
            )}
            {activeTab === 'streak' && (
              <>
                <div className="text-center">
                  <div className="text-5xl font-bold text-orange-500 animate-streak-fire">{streakData.currentStreak}</div>
                  <p className="text-amber-700 text-sm font-medium">
                    {language === 'tamil' ? 'தற்போதைய தொடர்' : 'Current Streak'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{streakData.longestStreak}</div>
                  <p className="text-amber-700 text-sm font-medium">
                    {language === 'tamil' ? 'சிறந்த தொடர்' : 'Best Streak'}
                  </p>
                </div>
              </>
            )}
            {activeTab === 'skill' && (
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {skillStats.puzzleFastestTime ? `${skillStats.puzzleFastestTime}s` : '--'}
                  </div>
                  <p className="text-amber-700 text-sm font-medium">
                    {language === 'tamil' ? 'வேகமான புதிர்' : 'Fastest Puzzle'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{skillStats.maxRaceWinStreak}</div>
                  <p className="text-amber-700 text-sm font-medium">
                    {language === 'tamil' ? 'பந்தய வெற்றி தொடர்' : 'Race Win Streak'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {activeTab === 'mastery' && (
              <>
                {badges.mastery.map((badge, i) => renderBadgeCard(badge, i))}
                {masteryMilestones
                  .filter(m => !badges.mastery.some(b => b.id === `mastery-${m}`))
                  .map((m, i) => renderLockedBadge(MASTERY_BADGES[m], `locked-mastery-${m}`, i))}
              </>
            )}
            {activeTab === 'streak' && (
              <>
                {badges.streak.map((badge, i) => renderBadgeCard(badge, i))}
                {streakMilestones
                  .filter(m => !badges.streak.some(b => b.id === `streak-${m}`))
                  .map((m, i) => renderLockedBadge(STREAK_BADGES[m], `locked-streak-${m}`, i))}
              </>
            )}
            {activeTab === 'skill' && (
              <>
                {badges.skill.map((badge, i) => renderBadgeCard(badge, i))}
                {skillKeys
                  .filter(key => !badges.skill.some(b => b.id === `skill-${key}`))
                  .map((key, i) => {
                    const info = SKILL_BADGES[key as keyof typeof SKILL_BADGES];
                    return renderLockedBadge(info, `locked-skill-${key}`, i);
                  })}
              </>
            )}
          </div>

          {/* Empty State */}
          {badges[activeTab].length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 opacity-50">
                {activeTab === 'mastery' ? '🎓' : activeTab === 'streak' ? '🔥' : '⭐'}
              </div>
              <p className="text-amber-700">
                {language === 'tamil'
                  ? (activeTab === 'mastery' 
                      ? 'ஒரு குறளின் அனைத்து செயல்பாடுகளையும் முடித்து முதல் பேட்ஜ் பெறுங்கள்!'
                      : activeTab === 'streak'
                      ? '3 நாட்கள் தொடர்ச்சியாக கற்றுக்கொள்ளுங்கள்!'
                      : 'சிறப்பு சாதனைகளை அடையுங்கள்!')
                  : (activeTab === 'mastery'
                      ? 'Complete all activities for a kural to earn mastery badges!'
                      : activeTab === 'streak'
                      ? 'Learn for 3 consecutive days to start earning streak badges!'
                      : 'Achieve special milestones to earn skill badges!')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200 text-center bg-amber-50/50">
          <p className="text-sm text-amber-700">
            {language === 'tamil' 
              ? '💡 உதவிக்குறிப்பு: ஒவ்வொரு குறளுக்கும் ஒலி, வீடியோ மற்றும் 4 விளையாட்டுகளை முடிக்கவும்'
              : '💡 Tip: Complete audio, video, and all 4 games for each kural to master it'}
          </p>
        </div>
      </div>

      {/* Celebration Effects */}
      {celebrationType === 'confetti' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-60">
          {[...Array(50)].map((_, i) => {
            const angle = (i / 50) * 360;
            const distance = 150 + Math.random() * 250;
            const tx = Math.cos(angle * Math.PI / 180) * distance;
            const ty = Math.sin(angle * Math.PI / 180) * distance;
            return (
              <div
                key={`confetti-${i}`}
                className="absolute left-1/2 top-1/2 animate-confetti text-2xl"
                style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${Math.random() * 0.5}s` } as React.CSSProperties}
              >
                {['🎉', '🎊', '✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 6)]}
              </div>
            );
          })}
        </div>
      )}

      {celebrationType === 'fireworks' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-60">
          {[...Array(5)].map((_, burst) => (
            <div key={`burst-${burst}`} className="absolute" style={{ left: `${15 + burst * 18}%`, top: `${30 + (burst % 2) * 20}%` }}>
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * 360;
                const distance = 100 + Math.random() * 100;
                const tx = Math.cos(angle * Math.PI / 180) * distance;
                const ty = Math.sin(angle * Math.PI / 180) * distance;
                return (
                  <div
                    key={`fw-${burst}-${i}`}
                    className="absolute animate-firework text-xl"
                    style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${burst * 0.3}s` } as React.CSSProperties}
                  >
                    {['💥', '🔥', '✨', '⚡'][Math.floor(Math.random() * 4)]}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {celebrationType === 'stars' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-60">
          {[...Array(30)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${20 + Math.random() * 24}px`
              }}
            >
              {['⭐', '🌟', '✨', '💫'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {celebrationType === 'balloons' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-60">
          {[...Array(20)].map((_, i) => (
            <div
              key={`balloon-${i}`}
              className="absolute animate-float-up"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: '-60px',
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${32 + Math.random() * 24}px`
              }}
            >
              🎈
            </div>
          ))}
        </div>
      )}

      {celebrationType === 'sparkles' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-60">
          {[...Array(40)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-sparkle-pop text-3xl"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 90}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {celebrationType === 'snow' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-60">
          {[...Array(50)].map((_, i) => (
            <div
              key={`snow-${i}`}
              className="absolute animate-snow text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-30px',
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 4}s`
              }}
            >
              {['❄️', '❅', '❆', '✧'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {celebrationType === 'golden' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-60">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/20 via-transparent to-amber-500/20 animate-golden-pulse" />
          {[...Array(30)].map((_, i) => {
            const angle = (i / 30) * 360;
            const distance = 100 + Math.random() * 200;
            const tx = Math.cos(angle * Math.PI / 180) * distance;
            const ty = Math.sin(angle * Math.PI / 180) * distance;
            return (
              <div
                key={`gold-${i}`}
                className="absolute left-1/2 top-1/2 animate-golden-burst text-3xl"
                style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${Math.random() * 0.5}s` } as React.CSSProperties}
              >
                {['🏆', '👑', '💰', '⭐', '🌟', '✨'][Math.floor(Math.random() * 6)]}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
