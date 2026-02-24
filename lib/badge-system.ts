export interface Badge {
  id: string;
  type: 'mastery' | 'streak' | 'skill' | 'tamil';
  category: string;
  name: string;
  nameTamil: string;
  description: string;
  descriptionTamil: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  earnedAt: string;
  viewed: boolean;
}

export interface KuralProgress {
  kuralId: number;
  audio: boolean;
  video: boolean;
  puzzle: boolean;
  flying: boolean;
  balloon: boolean;
  race: boolean;
  mastered: boolean;
  masteredAt?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalDays: number;
  streakBadgesEarned: string[];
}

export interface SkillStats {
  puzzleFastestTime: number | null;
  raceWinStreak: number;
  maxRaceWinStreak: number;
  perfectPronunciations: number;
  consecutivePerfectPronunciations: number;
  balloonPerfectGames: number;
  flyingPerfectGames: number;
  skillBadgesEarned: string[];
}

const MASTERY_MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 1330];
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export const MASTERY_BADGES: Record<number, { name: string; nameTamil: string; icon: string; tier: Badge['tier'] }> = {
  1: { name: 'First Steps', nameTamil: 'முதல் அடி', icon: '🌱', tier: 'bronze' },
  5: { name: 'Quick Learner', nameTamil: 'விரைவான கற்பவர்', icon: '📚', tier: 'bronze' },
  10: { name: 'Rising Star', nameTamil: 'வளரும் நட்சத்திரம்', icon: '⭐', tier: 'silver' },
  25: { name: 'Kural Champion', nameTamil: 'குறள் வெற்றியாளர்', icon: '🏆', tier: 'silver' },
  50: { name: 'Wisdom Seeker', nameTamil: 'ஞானம் தேடுபவர்', icon: '🦉', tier: 'gold' },
  100: { name: 'Kural Master', nameTamil: 'குறள் மாஸ்டர்', icon: '👑', tier: 'gold' },
  250: { name: 'Scholar Elite', nameTamil: 'சிறந்த அறிஞர்', icon: '🎓', tier: 'gold' },
  500: { name: 'Thiruvalluvar\'s Pride', nameTamil: 'திருவள்ளுவரின் பெருமை', icon: '🌟', tier: 'diamond' },
  1000: { name: 'Legend', nameTamil: 'புராண நாயகன்', icon: '💎', tier: 'diamond' },
  1330: { name: 'Thirukural Complete', nameTamil: 'திருக்குறள் நிறைவு', icon: '🏛️', tier: 'diamond' }
};

export const STREAK_BADGES: Record<number, { name: string; nameTamil: string; icon: string; tier: Badge['tier'] }> = {
  3: { name: '3-Day Fire', nameTamil: '3-நாள் தீ', icon: '🔥', tier: 'bronze' },
  7: { name: 'Week Warrior', nameTamil: 'வாரம் போர்வீரர்', icon: '⚔️', tier: 'bronze' },
  14: { name: 'Fortnight Fighter', nameTamil: 'இரண்டு வார போராளி', icon: '🛡️', tier: 'silver' },
  30: { name: 'Monthly Master', nameTamil: 'மாத மாஸ்டர்', icon: '📅', tier: 'silver' },
  60: { name: 'Dedication King', nameTamil: 'அர்ப்பணிப்பு அரசன்', icon: '👑', tier: 'gold' },
  100: { name: 'Century Streak', nameTamil: 'நூற்றாண்டு தொடர்', icon: '💯', tier: 'gold' },
  365: { name: 'Year of Wisdom', nameTamil: 'ஞான வருடம்', icon: '🌍', tier: 'diamond' }
};

export const SKILL_BADGES = {
  speedDemon: { name: 'Speed Demon', nameTamil: 'வேக அரக்கன்', icon: '⚡', tier: 'gold' as Badge['tier'], description: 'Complete puzzle in under 30 seconds', descriptionTamil: '30 வினாடிக்குள் புதிர் முடிக்கவும்' },
  unbeatable: { name: 'Unbeatable', nameTamil: 'தோற்கடிக்க முடியாதவர்', icon: '🏅', tier: 'gold' as Badge['tier'], description: 'Win 5 races in a row', descriptionTamil: 'தொடர்ந்து 5 பந்தயங்களை வெல்லுங்கள்' },
  sharpEars: { name: 'Sharp Ears', nameTamil: 'கூர்மையான காதுகள்', icon: '👂', tier: 'silver' as Badge['tier'], description: 'Perfect pronunciation 3 times in a row', descriptionTamil: 'தொடர்ந்து 3 முறை சரியான உச்சரிப்பு' },
  balloonMaster: { name: 'Balloon Master', nameTamil: 'பலூன் மாஸ்டர்', icon: '🎈', tier: 'silver' as Badge['tier'], description: 'Perfect balloon game with no mistakes', descriptionTamil: 'தவறு இல்லாமல் பலூன் விளையாட்டு' },
  flyingAce: { name: 'Flying Ace', nameTamil: 'பறக்கும் சாம்பியன்', icon: '🦅', tier: 'silver' as Badge['tier'], description: 'Catch all flying words in correct order first try', descriptionTamil: 'முதல் முயற்சியில் சரியான வரிசையில் பிடிக்கவும்' },
  puzzlePro: { name: 'Puzzle Pro', nameTamil: 'புதிர் வல்லுநர்', icon: '🧩', tier: 'gold' as Badge['tier'], description: 'Complete 10 puzzles perfectly', descriptionTamil: '10 புதிர்களை சரியாக முடிக்கவும்' },
  raceLegend: { name: 'Race Legend', nameTamil: 'பந்தய புராணம்', icon: '🏎️', tier: 'diamond' as Badge['tier'], description: 'Win 25 races total', descriptionTamil: 'மொத்தம் 25 பந்தயங்களை வெல்லுங்கள்' }
};

// Tamil Script badges — keyed by letters completed count
export const TAMIL_BADGES: Record<string, { name: string; nameTamil: string; icon: string; tier: Badge['tier']; lettersNeeded: number; description: string; descriptionTamil: string }> = {
  'tamil-first': { name: 'First Letter!', nameTamil: 'முதல் எழுத்து', icon: '✍️', tier: 'bronze', lettersNeeded: 1, description: 'Learned your first Tamil letter', descriptionTamil: 'முதல் தமிழ் எழுத்து கற்றீர்கள்' },
  'tamil-vowels': { name: 'Vowel Vibes', nameTamil: 'உயிர் வீரர்', icon: '🔤', tier: 'bronze', lettersNeeded: 12, description: 'Mastered all 12 uyir vowels', descriptionTamil: '12 உயிர் எழுத்துக்கள் கற்றீர்கள்' },
  'tamil-consonants': { name: 'Consonant King', nameTamil: 'மெய் அரசன்', icon: '💪', tier: 'silver', lettersNeeded: 30, description: 'Mastered the mei consonants', descriptionTamil: 'மெய் எழுத்துக்கள் கற்றீர்கள்' },
  'tamil-combo25': { name: 'Combo Starter', nameTamil: 'இணைவு ஆரம்பம்', icon: '⚡', tier: 'silver', lettersNeeded: 55, description: 'Learning uyirmei combinations', descriptionTamil: '55 உயிர்மெய் எழுத்துக்கள் கற்றீர்கள்' },
  'tamil-halfway': { name: 'Halfway There', nameTamil: 'பாதி வழி', icon: '🎯', tier: 'gold', lettersNeeded: 130, description: 'Halfway through the Tamil alphabet', descriptionTamil: 'பாதி தமிழ் எழுத்துக்கள் கற்றீர்கள்' },
  'tamil-scholar': { name: 'Tamil Scholar', nameTamil: 'தமிழ் அறிஞர்', icon: '🌟', tier: 'diamond', lettersNeeded: 247, description: 'Completed the full Tamil alphabet!', descriptionTamil: '247 எழுத்துக்கள் அனைத்தும் கற்றீர்கள்!' },
};

export function getTamilLettersCompleted(): number {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('learntamil-completed');
  if (!saved) return 0;
  try { return (JSON.parse(saved) as string[]).length; } catch { return 0; }
}

export function checkTamilBadges(): Badge[] {
  if (typeof window === 'undefined') return [];
  const completed = getTamilLettersCompleted();
  const allBadges = getAllBadges();
  const earned: Badge[] = [];
  for (const [id, info] of Object.entries(TAMIL_BADGES)) {
    if (completed >= info.lettersNeeded && !allBadges.some(b => b.id === `tamil-${id.replace('tamil-', '')}`)) {
      const badge: Badge = {
        id,
        type: 'tamil',
        category: 'tamil',
        name: info.name,
        nameTamil: info.nameTamil,
        description: info.description,
        descriptionTamil: info.descriptionTamil,
        icon: info.icon,
        tier: info.tier,
        earnedAt: new Date().toISOString(),
        viewed: false,
      };
      saveBadge(badge);
      earned.push(badge);
    }
  }
  return earned;
}

export function getKuralProgress(): KuralProgress[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('thirukural-kural-progress');
  return saved ? JSON.parse(saved) : [];
}

export function saveKuralProgress(progress: KuralProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('thirukural-kural-progress', JSON.stringify(progress));
}

export function updateKuralActivity(kuralId: number, activity: keyof Omit<KuralProgress, 'kuralId' | 'mastered' | 'masteredAt'>): KuralProgress {
  const allProgress = getKuralProgress();
  let kuralProgress = allProgress.find(p => p.kuralId === kuralId);

  if (!kuralProgress) {
    kuralProgress = {
      kuralId,
      audio: false,
      video: false,
      puzzle: false,
      flying: false,
      balloon: false,
      race: false,
      mastered: false
    };
    allProgress.push(kuralProgress);
  }

  kuralProgress[activity] = true;

  const isMastered = kuralProgress.audio && kuralProgress.video &&
    kuralProgress.puzzle && kuralProgress.flying &&
    kuralProgress.balloon && kuralProgress.race;

  if (isMastered && !kuralProgress.mastered) {
    kuralProgress.mastered = true;
    kuralProgress.masteredAt = new Date().toISOString();
  }

  saveKuralProgress(allProgress);
  return kuralProgress;
}

export function getMasteredCount(): number {
  return getKuralProgress().filter(p => p.mastered).length;
}

export function getStreakData(): StreakData {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalDays: 0, streakBadgesEarned: [] };
  }
  const saved = localStorage.getItem('thirukural-streak-data');
  if (saved) return JSON.parse(saved);
  return { currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalDays: 0, streakBadgesEarned: [] };
}

export function saveStreakData(data: StreakData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('thirukural-streak-data', JSON.stringify(data));
}

export function recordDailyVisit(): void {
  const today = new Date().toISOString().split('T')[0];
  const data = getStreakData();

  if (data.lastActiveDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (data.lastActiveDate === yesterdayStr) {
    data.currentStreak += 1;
  } else if (data.lastActiveDate !== today) {
    data.currentStreak = 1;
  }

  data.lastActiveDate = today;
  data.totalDays += 1;

  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  saveStreakData(data);
}

export function checkStreakBadge(currentStreak: number): Badge | null {
  const data = getStreakData();

  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak >= milestone && !data.streakBadgesEarned.includes(`streak-${milestone}`)) {
      const badgeInfo = STREAK_BADGES[milestone];
      const badge: Badge = {
        id: `streak-${milestone}`,
        type: 'streak',
        category: 'streak',
        name: badgeInfo.name,
        nameTamil: badgeInfo.nameTamil,
        description: `${milestone} day streak achieved!`,
        descriptionTamil: `${milestone} நாள் தொடர் சாதனை!`,
        icon: badgeInfo.icon,
        tier: badgeInfo.tier,
        earnedAt: new Date().toISOString(),
        viewed: false
      };
      data.streakBadgesEarned.push(`streak-${milestone}`);
      saveStreakData(data);
      return badge;
    }
  }
  return null;
}

export function updateStreak(): { streakData: StreakData; newBadge: Badge | null } {
  const today = new Date().toISOString().split('T')[0];
  const data = getStreakData();

  if (data.lastActiveDate === today) {
    return { streakData: data, newBadge: null };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (data.lastActiveDate === yesterdayStr) {
    data.currentStreak += 1;
  } else if (data.lastActiveDate !== today) {
    data.currentStreak = 1;
  }

  data.lastActiveDate = today;
  data.totalDays += 1;

  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  let newBadge: Badge | null = null;
  for (const milestone of STREAK_MILESTONES) {
    if (data.currentStreak >= milestone && !data.streakBadgesEarned.includes(`streak-${milestone}`)) {
      const badgeInfo = STREAK_BADGES[milestone];
      newBadge = {
        id: `streak-${milestone}`,
        type: 'streak',
        category: 'streak',
        name: badgeInfo.name,
        nameTamil: badgeInfo.nameTamil,
        description: `${milestone} day streak achieved!`,
        descriptionTamil: `${milestone} நாள் தொடர் சாதனை!`,
        icon: badgeInfo.icon,
        tier: badgeInfo.tier,
        earnedAt: new Date().toISOString(),
        viewed: false
      };
      data.streakBadgesEarned.push(`streak-${milestone}`);
      break;
    }
  }

  saveStreakData(data);
  return { streakData: data, newBadge };
}

export function getSkillStats(): SkillStats {
  if (typeof window === 'undefined') {
    return { puzzleFastestTime: null, raceWinStreak: 0, maxRaceWinStreak: 0, perfectPronunciations: 0, consecutivePerfectPronunciations: 0, balloonPerfectGames: 0, flyingPerfectGames: 0, skillBadgesEarned: [] };
  }
  const saved = localStorage.getItem('thirukural-skill-stats');
  if (saved) return JSON.parse(saved);
  return { puzzleFastestTime: null, raceWinStreak: 0, maxRaceWinStreak: 0, perfectPronunciations: 0, consecutivePerfectPronunciations: 0, balloonPerfectGames: 0, flyingPerfectGames: 0, skillBadgesEarned: [] };
}

export function saveSkillStats(stats: SkillStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('thirukural-skill-stats', JSON.stringify(stats));
}

export function checkSkillBadge(skillId: string, stats: SkillStats): Badge | null {
  if (stats.skillBadgesEarned.includes(skillId)) return null;

  const skillInfo = SKILL_BADGES[skillId as keyof typeof SKILL_BADGES];
  if (!skillInfo) return null;

  let earned = false;

  switch (skillId) {
    case 'speedDemon':
      earned = stats.puzzleFastestTime !== null && stats.puzzleFastestTime < 30;
      break;
    case 'unbeatable':
      earned = stats.maxRaceWinStreak >= 5;
      break;
    case 'sharpEars':
      earned = stats.consecutivePerfectPronunciations >= 3;
      break;
    case 'balloonMaster':
      earned = stats.balloonPerfectGames >= 1;
      break;
    case 'flyingAce':
      earned = stats.flyingPerfectGames >= 1;
      break;
    case 'puzzlePro':
      earned = stats.puzzleFastestTime !== null;
      break;
  }

  if (earned) {
    stats.skillBadgesEarned.push(skillId);
    saveSkillStats(stats);

    return {
      id: `skill-${skillId}`,
      type: 'skill',
      category: 'skill',
      name: skillInfo.name,
      nameTamil: skillInfo.nameTamil,
      description: skillInfo.description,
      descriptionTamil: skillInfo.descriptionTamil,
      icon: skillInfo.icon,
      tier: skillInfo.tier,
      earnedAt: new Date().toISOString(),
      viewed: false
    };
  }

  return null;
}

export function checkMasteryBadge(masteredCount: number): Badge | null {
  const allBadges = getAllBadges();

  for (const milestone of MASTERY_MILESTONES) {
    if (masteredCount >= milestone) {
      const badgeId = `mastery-${milestone}`;
      if (!allBadges.some(b => b.id === badgeId)) {
        const badgeInfo = MASTERY_BADGES[milestone];
        return {
          id: badgeId,
          type: 'mastery',
          category: 'mastery',
          name: badgeInfo.name,
          nameTamil: badgeInfo.nameTamil,
          description: `Mastered ${milestone} kurals!`,
          descriptionTamil: `${milestone} குறள்களை முழுமையாக கற்றீர்கள்!`,
          icon: badgeInfo.icon,
          tier: badgeInfo.tier,
          earnedAt: new Date().toISOString(),
          viewed: false
        };
      }
    }
  }

  return null;
}

export function getAllBadges(): Badge[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('thirukural-all-badges');
  return saved ? JSON.parse(saved) : [];
}

export function saveBadge(badge: Badge): void {
  if (typeof window === 'undefined') return;
  const allBadges = getAllBadges();
  if (!allBadges.some(b => b.id === badge.id)) {
    allBadges.push(badge);
    localStorage.setItem('thirukural-all-badges', JSON.stringify(allBadges));
  }
}

export function markBadgesViewed(): void {
  if (typeof window === 'undefined') return;
  const allBadges = getAllBadges();
  const updated = allBadges.map(b => ({ ...b, viewed: true }));
  localStorage.setItem('thirukural-all-badges', JSON.stringify(updated));
}

export function getUnviewedBadgeCount(): number {
  return getAllBadges().filter(b => !b.viewed).length;
}

export function getBadgesByCategory(): { mastery: Badge[]; streak: Badge[]; skill: Badge[]; tamil: Badge[] } {
  const allBadges = getAllBadges();
  return {
    mastery: allBadges.filter(b => b.type === 'mastery'),
    streak: allBadges.filter(b => b.type === 'streak'),
    skill: allBadges.filter(b => b.type === 'skill'),
    tamil: allBadges.filter(b => b.type === 'tamil'),
  };
}
