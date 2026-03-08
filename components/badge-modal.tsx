import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import {
  Badge,
  getAllBadges,
  getBadgesByCategory,
  getStreakData,
  getSkillStats,
  getMasteredCount,
  markBadgesViewed,
  MASTERY_BADGES,
  STREAK_BADGES,
  SKILL_BADGES,
  TAMIL_BADGES,
  getTamilLettersCompleted,
  checkTamilBadges,
} from '@/lib/badge-system';
import ReactingAvatar from './reacting-avatar';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: 'tamil' | 'english';
  celebrationType: 'confetti' | 'fireworks' | 'stars' | 'balloons' | 'snow' | 'golden' | null;
  profileId?: string;
  profileData?: {
    coins: number;
    weeklyXP?: number;
    streak: number;
    longestStreak: number;
    completedChapters: number[];
    badges: any[];
  };
}

const TIER_STYLES: Record<Badge['tier'], { card: string; label: string; labelText: string; dot: string; holographic?: boolean }> = {
  bronze: {
    card: 'bg-white/40 backdrop-blur-md border-amber-400/30 shadow-sm',
    label: 'bg-amber-600 text-white',
    labelText: 'Rookie',
    dot: 'bg-amber-500',
  },
  silver: {
    card: 'bg-white/40 backdrop-blur-md border-slate-400/30 shadow-sm',
    label: 'bg-slate-600 text-white',
    labelText: 'Pro',
    dot: 'bg-slate-400',
  },
  gold: {
    card: 'bg-white/40 backdrop-blur-md border-yellow-400/30 shadow-md',
    label: 'bg-yellow-600 text-white',
    labelText: 'Elite',
    dot: 'bg-yellow-500',
    holographic: true,
  },
  diamond: {
    card: 'bg-white/40 backdrop-blur-md border-purple-400/30 shadow-lg',
    label: 'bg-purple-600 text-white',
    labelText: 'GOAT',
    dot: 'bg-purple-500',
    holographic: true,
  },
};

export default function BadgeModal({ isOpen, onClose, language, celebrationType, profileId: explicitProfileId, profileData }: Props) {
  const [activeTab, setActiveTab] = useState<'mastery' | 'streak' | 'skill' | 'tamil'>('mastery');
  const [badges, setBadges] = useState<{ mastery: Badge[]; streak: Badge[]; skill: Badge[]; tamil: Badge[] }>({
    mastery: [], streak: [], skill: [], tamil: [],
  });
  const [visibleCelebration, setVisibleCelebration] = useState<Props['celebrationType']>(null);
  const [isFading, setIsFading] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalDays: 0 });
  const [skillStats, setSkillStats] = useState({ puzzleFastestTime: null as number | null, maxRaceWinStreak: 0 });
  const [tamilCompleted, setTamilCompleted] = useState(0);

  const { user } = useAuth();
  const [userStats, setUserStats] = useState<{ coins: number; weeklyXP: number; streak: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (profileData) {
        // Fast-path: Explicit profile data provided (e.g., from Parent Dashboard for a specific child)
        setBadges({
          mastery: profileData.badges.filter(b => b.type === 'mastery'),
          streak: profileData.badges.filter(b => b.type === 'streak'),
          skill: profileData.badges.filter(b => b.type === 'skill'),
          tamil: profileData.badges.filter(b => b.type === 'tamil'),
        });
        setMasteredCount(profileData.completedChapters.length);
        setStreakData({ currentStreak: profileData.streak, longestStreak: profileData.longestStreak, totalDays: profileData.streak });
        setSkillStats({ puzzleFastestTime: null, maxRaceWinStreak: 0 }); // Fallback for explicit data
        setTamilCompleted(0);
        setUserStats({
          coins: profileData.coins,
          weeklyXP: profileData.weeklyXP ?? 0,
          streak: profileData.streak
        });
      } else {
        // Standard path: Load from storage or current user session
        const profileId = explicitProfileId || user?.activeProfileId || user?.id || 'guest';
        checkTamilBadges(profileId);
        setBadges(getBadgesByCategory(user, profileId));
        setMasteredCount(getMasteredCount(profileId));
        setStreakData(getStreakData(user, profileId));
        setSkillStats(getSkillStats(profileId));
        setTamilCompleted(getTamilLettersCompleted(profileId));
        markBadgesViewed(profileId);

        if (user) {
          setUserStats({
            coins: user.coins ?? 0,
            weeklyXP: user.weeklyXP ?? 0,
            streak: user.streak ?? 0
          });
        }
      }

      // Sync celebration and set cleanup timer
      if (celebrationType) {
        setVisibleCelebration(celebrationType);
        setIsFading(false);
        const fadeTimer = setTimeout(() => setIsFading(true), 3000);
        const clearTimer = setTimeout(() => setVisibleCelebration(null), 5000);
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(clearTimer);
        };
      }
    } else {
      setVisibleCelebration(null);
      setIsFading(false);
    }
  }, [isOpen, user, celebrationType, explicitProfileId, profileData]);

  if (!isOpen) return null;

  const totalBadges = badges.mastery.length + badges.streak.length + badges.skill.length + badges.tamil.length;
  const masteryMilestones = Object.keys(MASTERY_BADGES).map(Number);
  const streakMilestones = Object.keys(STREAK_BADGES).map(Number);
  const skillKeys = Object.keys(SKILL_BADGES);
  const tamilKeys = Object.keys(TAMIL_BADGES);

  const tabs = [
    { id: 'mastery' as const, emoji: '🎓', en: 'Mastery', ta: 'குறள் தேர்ச்சி', count: badges.mastery.length },
    { id: 'streak' as const, emoji: '🔥', en: 'Streak', ta: 'தொடர்', count: badges.streak.length },
    { id: 'skill' as const, emoji: '⭐', en: 'Skills', ta: 'திறன்', count: badges.skill.length },
    { id: 'tamil' as const, emoji: '✍️', en: 'Tamil', ta: 'தமிழ்', count: badges.tamil.length },
  ];

  // XP-style level from total badges
  const level = Math.max(1, Math.floor(totalBadges / 3) + 1);
  const xpProgress = ((totalBadges % 3) / 3) * 100;

  const renderBadgeCard = (badge: Badge, index: number) => {
    const style = TIER_STYLES[badge.tier];
    return (
      <div
        key={badge.id}
        className={`relative p-3 rounded-2xl border-2 transition-all duration-300 cursor-default group overflow-hidden ${style.card} ${style.holographic ? 'holographic-border animate-badge-entrance' : 'animate-badge-entrance'} ${!badge.viewed ? 'ring-2 ring-orange-500 animate-badge-flip scale-110' : 'hover:scale-105'}`}
        style={{ animationDelay: `${index * 0.07}s` }}
      >
        {style.holographic && (
          <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full duration-1000" />
        )}
        {!badge.viewed && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500" />
          </span>
        )}
        <div className="text-3xl text-center mb-1.5">{badge.icon}</div>
        <div className="text-center">
          <div className="font-bold text-gray-800 text-xs leading-tight">
            {language === 'tamil' ? badge.nameTamil : badge.name}
          </div>
          <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${style.label}`}>
            {style.labelText}
          </span>
        </div>
      </div>
    );
  };

  const renderLockedCard = (info: { name: string; nameTamil: string; icon: string; tier: Badge['tier'] }, key: string, index: number) => (
    <div
      key={key}
      className="relative p-3 rounded-2xl border-2 border-gray-200 bg-gray-50 opacity-50"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="text-3xl text-center mb-1.5 grayscale">{info.icon}</div>
      <div className="text-center">
        <div className="font-semibold text-gray-500 text-xs">
          {language === 'tamil' ? info.nameTamil : info.name}
        </div>
        <span className="mt-1 inline-block text-[10px] text-gray-400 font-medium">🔒 locked</span>
      </div>
    </div>
  );

  const renderProgressBar = (value: number, max: number, color: string, label: string) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div className="flex-1 min-w-[80px]">
        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 flex flex-col"
        style={{ height: 'min(88vh, 640px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-orange-500 px-4 py-4 shrink-0 rounded-t-2xl relative overflow-hidden">
          {/* Animated Background Circles */}
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-700" />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-ping" />
                <ReactingAvatar emotion="happy" className="w-16 h-16 !bg-transparent !border-white/30 !scale-100 shadow-xl" showDismiss={false} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  {language === 'tamil' ? 'சாதனை பேட்ஜ்கள்' : 'Achievements'}
                </h2>
                <p className="text-xs text-white/80">
                  {language === 'tamil'
                    ? `${totalBadges} பேட்ஜ்கள் • நிலை ${level}`
                    : `${totalBadges} badges · Level ${level}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all font-bold"
            >
              ✕
            </button>
          </div>
          {/* XP Bar */}
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-[10px] font-bold shrink-0">LVL {level}</span>
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full transition-all duration-1000"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <span className="text-white/70 text-[10px] font-bold shrink-0">LVL {level + 1}</span>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        {userStats && (
          <div className="flex bg-white shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)] z-10 px-4 py-3 items-center justify-between border-b border-gray-100 shrink-0">
            <div className="text-center flex-1">
              <div className="text-xl leading-none mb-1">🪙</div>
              <div className="font-extrabold text-amber-500 text-lg">{userStats.coins}</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">{language === 'tamil' ? 'மொத்த நாணயம்' : 'All Coins'}</div>
            </div>
            <div className="w-px h-10 bg-gray-100"></div>
            <div className="text-center flex-1">
              <div className="text-xl leading-none mb-1">⚡</div>
              <div className="font-extrabold text-purple-500 text-lg">{userStats.weeklyXP}</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">{language === 'tamil' ? 'வார புள்ளிகள்' : 'Weekly Points'}</div>
            </div>
            <div className="w-px h-10 bg-gray-100"></div>
            <div className="text-center flex-1">
              <div className="text-xl leading-none mb-1">🔥</div>
              <div className="font-extrabold text-orange-500 text-lg">{userStats.streak}d</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">{language === 'tamil' ? 'தொடர்ச்சி' : 'Streak'}</div>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 shrink-0 px-2 pt-1.5 gap-1 shadow-inner">

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                ? 'bg-white shadow-sm text-purple-700 border border-purple-100'
                : 'text-gray-500 hover:text-purple-600 hover:bg-white/70'
                }`}
            >
              <span className="text-base">{tab.emoji}</span>
              <span className="hidden sm:block text-[10px] mt-0.5">{language === 'tamil' ? tab.ta.split(' ')[0] : tab.en}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0 bg-orange-500 text-white text-[9px] rounded-full font-extrabold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Stats row ── */}
        <div className="px-4 pt-2 pb-1.5 flex gap-4 items-center shrink-0">
          {activeTab === 'mastery' && renderProgressBar(masteredCount, 1330, 'bg-gradient-to-r from-amber-400 to-orange-500', language === 'tamil' ? 'குறள் கற்றது' : 'Kurals Mastered')}
          {activeTab === 'streak' && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-orange-500 leading-none">{streakData.currentStreak}</span>
                <span className="text-xs text-gray-500 mt-0.5">{language === 'tamil' ? 'தற்போதைய' : 'Current'} 🔥</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-amber-500 leading-none">{streakData.longestStreak}</span>
                <span className="text-xs text-gray-500 mt-0.5">{language === 'tamil' ? 'சிறந்த' : 'Best'} 🏅</span>
              </div>
            </>
          )}
          {activeTab === 'skill' && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-extrabold text-blue-600">{skillStats.puzzleFastestTime ? `${skillStats.puzzleFastestTime}s` : '--'}</span>
                <span className="text-xs text-gray-500 mt-0.5">{language === 'tamil' ? 'வேகமான புதிர்' : 'Fastest Puzzle'}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-extrabold text-green-600">{skillStats.maxRaceWinStreak}</span>
                <span className="text-xs text-gray-500 mt-0.5">{language === 'tamil' ? 'பந்தய வெற்றி' : 'Race Streak'}</span>
              </div>
            </>
          )}
          {activeTab === 'tamil' && renderProgressBar(tamilCompleted, 247, 'bg-gradient-to-r from-rose-400 to-orange-400', language === 'tamil' ? 'எழுத்துக்கள் கற்றது' : 'Letters Learned')}
        </div>

        {/* ── Badge grid ── */}
        <div className="px-4 pb-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {activeTab === 'mastery' && (
              <>
                {badges.mastery.map((b, i) => renderBadgeCard(b, i))}
                {masteryMilestones
                  .filter(m => !badges.mastery.some(b => b.id === `mastery-${m}`))
                  .map((m, i) => renderLockedCard(MASTERY_BADGES[m], `lm-${m}`, i))}
              </>
            )}
            {activeTab === 'streak' && (
              <>
                {badges.streak.map((b, i) => renderBadgeCard(b, i))}
                {streakMilestones
                  .filter(m => !badges.streak.some(b => b.id === `streak-${m}`))
                  .map((m, i) => renderLockedCard(STREAK_BADGES[m], `ls-${m}`, i))}
              </>
            )}
            {activeTab === 'skill' && (
              <>
                {badges.skill.map((b, i) => renderBadgeCard(b, i))}
                {skillKeys
                  .filter(k => !badges.skill.some(b => b.id === `skill-${k}`))
                  .map((k, i) => renderLockedCard(SKILL_BADGES[k as keyof typeof SKILL_BADGES], `lsk-${k}`, i))}
              </>
            )}
            {activeTab === 'tamil' && (
              <>
                {badges.tamil.map((b, i) => renderBadgeCard(b, i))}
                {tamilKeys
                  .filter(k => !badges.tamil.some(b => b.id === k))
                  .map((k, i) => {
                    const info = TAMIL_BADGES[k];
                    return renderLockedCard(info, `lt-${k}`, i);
                  })}
              </>
            )}
          </div>

          {/* Empty state */}
          {badges[activeTab === 'mastery' ? 'mastery' : activeTab === 'streak' ? 'streak' : activeTab === 'skill' ? 'skill' : 'tamil'].length === 0 && (
            <div className="text-center py-8">
              <div className="text-5xl mb-3 opacity-40">
                {activeTab === 'mastery' ? '🎓' : activeTab === 'streak' ? '🔥' : activeTab === 'skill' ? '⭐' : '✍️'}
              </div>
              <p className="text-gray-400 text-sm font-medium">
                {language === 'tamil'
                  ? (activeTab === 'mastery' ? 'குறள் கற்று முதல் பேட்ஜ் பெறுங்கள்!'
                    : activeTab === 'streak' ? '3 நாட்கள் தொடர்ச்சியாக கற்கவும்!'
                      : activeTab === 'skill' ? 'சிறப்பு சாதனைகளை அடையுங்கள்!'
                        : 'தமிழ் எழுத்துக்கள் கற்கத் தொடங்குங்கள்!')
                  : (activeTab === 'mastery' ? 'Master your first kural to earn a badge!'
                    : activeTab === 'streak' ? 'Learn 3 days in a row to start!'
                      : activeTab === 'skill' ? 'Hit special milestones to earn skill badges!'
                        : 'Start learning Tamil letters to unlock badges!')}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer tip ── */}
        <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/60 shrink-0">
          <p className="text-xs text-amber-700 text-center font-medium">
            {language === 'tamil'
              ? '💡 ஒவ்வொரு குறளுக்கும் ஒலி, வீடியோ மற்றும் 4 விளையாட்டுகளை முடிக்கவும்'
              : '💡 Complete audio, video & all 4 games per kural to master it'}
          </p>
        </div>
      </div>

      {/* ── Celebration Effects (Fading wrapper) ── */}
      {visibleCelebration && (
        <div className={`fixed inset-0 pointer-events-none overflow-hidden z-60 transition-opacity duration-[2000ms] ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          {visibleCelebration === 'confetti' && (
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => {
                const angle = (i / 50) * 360;
                const distance = 150 + Math.random() * 250;
                const tx = Math.cos(angle * Math.PI / 180) * distance;
                const ty = Math.sin(angle * Math.PI / 180) * distance;
                return (
                  <div key={`confetti-${i}`} className="absolute left-1/2 top-1/2 animate-confetti text-2xl"
                    style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${Math.random() * 0.5}s` } as React.CSSProperties}>
                    {['🎉', '🎊', '✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 6)]}
                  </div>
                );
              })}
            </div>
          )}
          {visibleCelebration === 'fireworks' && (
            <div className="absolute inset-0">
              {[...Array(5)].map((_, burst) => (
                <div key={`burst-${burst}`} className="absolute" style={{ left: `${15 + burst * 18}%`, top: `${30 + (burst % 2) * 20}%` }}>
                  {[...Array(12)].map((_, i) => {
                    const angle = (i / 12) * 360;
                    const tx = Math.cos(angle * Math.PI / 180) * (100 + Math.random() * 100);
                    const ty = Math.sin(angle * Math.PI / 180) * (100 + Math.random() * 100);
                    return <div key={`fw-${burst}-${i}`} className="absolute animate-firework text-xl"
                      style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${burst * 0.3}s` } as React.CSSProperties}>
                      {['💥', '🔥', '✨', '⚡'][Math.floor(Math.random() * 4)]}
                    </div>;
                  })}
                </div>
              ))}
            </div>
          )}
          {visibleCelebration === 'stars' && (
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <div key={`star-${i}`} className="absolute animate-ping"
                  style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, fontSize: `${20 + Math.random() * 24}px` }}>
                  {['⭐', '🌟', '✨', '💫'][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </div>
          )}
          {visibleCelebration === 'snow' && (
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => (
                <div key={`snow-${i}`} className="absolute animate-snow text-2xl"
                  style={{ left: `${Math.random() * 100}%`, top: '-30px', animationDelay: `${Math.random() * 4}s`, animationDuration: `${4 + Math.random() * 4}s` }}>
                  {['❄️', '❅', '❆', '✧'][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </div>
          )}
          {visibleCelebration === 'golden' && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/20 via-transparent to-amber-500/20 animate-golden-pulse" />
              {[...Array(30)].map((_, i) => {
                const angle = (i / 30) * 360;
                const tx = Math.cos(angle * Math.PI / 180) * (100 + Math.random() * 200);
                const ty = Math.sin(angle * Math.PI / 180) * (100 + Math.random() * 200);
                return <div key={`gold-${i}`} className="absolute left-1/2 top-1/2 animate-golden-burst text-3xl"
                  style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${Math.random() * 0.5}s` } as React.CSSProperties}>
                  {['🏆', '👑', '💰', '⭐', '🌟', '✨'][Math.floor(Math.random() * 6)]}
                </div>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
