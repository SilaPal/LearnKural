'use client';
import { useAvatarEmotion } from '@/lib/use-avatar-emotion';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { Kural } from '@/shared/schema';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';
import { useAuth } from '@/lib/use-auth';
import ReactingAvatar from '@/components/reacting-avatar';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';
import { BadgeEarnedToast } from '@/components/badge-earned-toast';
import { NavigationModal, KuralSlugMap } from '@/components/navigation-modal';
import { syncVisitedToDB } from '@/lib/db-sync';
import {
  updateKuralActivity,
  updateStreak,
  getStreakData,
  getSkillStats,
  saveSkillStats,
  checkSkillBadge,
  checkMasteryBadge,
  getMasteredCount,
  saveBadge,
  getAllBadges,
  getUnviewedBadgeCount,
  recordDailyVisit,
  Badge
} from '@/lib/badge-system';

interface PuzzlePiece {
  id: string;
  word: string;
  correctPosition: number;
}

interface FlyingWord {
  id: string;
  word: string;
  correctPosition: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  isClicked: boolean;
}

interface RunnerWord {
  id: string;
  word: string;
  correctPosition: number;
  isCollected: boolean;
}

interface BalloonWord {
  id: string;
  word: string;
  correctPosition: number;
  isPopped: boolean;
  x: number;
  y: number;
  color: string;
  bobOffset: number;
}


type CelebrationType = 'confetti' | 'fireworks' | 'stars' | 'balloons' | 'snow' | 'golden' | null;

interface Props {
  initialKurals: Kural[];
  initialGame?: 'puzzle' | 'flying' | 'balloon' | 'race';
  initialKuralId?: number;
  initialChapter?: number;
  isEmbed?: boolean;
}

const getTextColorForBackground = (hexColor: string): string => {
  const lightColors = ['#FFEAA7', '#F7DC6F', '#96CEB4', '#98D8C8'];
  return lightColors.includes(hexColor.toUpperCase()) ? '#333333' : '#FFFFFF';
};

export default function KuralPlayingClient({ initialKurals, initialGame, initialKuralId, initialChapter, isEmbed = false }: Props) {
  const [currentLanguage, setCurrentLanguage] = useState<'tamil' | 'english'>('english');
  const [gameMode, setGameMode] = useState<'puzzle' | 'flying' | 'balloon' | 'race'>(initialGame || 'puzzle');

  const getInitialKuralIndex = () => {
    if (initialKuralId) {
      const index = initialKurals.findIndex(k => k.id === initialKuralId);
      return index >= 0 ? index : 0;
    }
    return 0;
  };
  const [currentKuralIndex, setCurrentKuralIndex] = useState(getInitialKuralIndex());
  const [shuffledPieces, setShuffledPieces] = useState<PuzzlePiece[]>([]);
  const [placedPieces, setPlacedPieces] = useState<(PuzzlePiece | null)[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [puzzleTimer, setPuzzleTimer] = useState(0);
  const [puzzleTimerActive, setPuzzleTimerActive] = useState(false);
  const [puzzleStreak, setPuzzleStreak] = useState(0);
  const [puzzleBonusPoints, setPuzzleBonusPoints] = useState(0);
  const [lastPlacedCorrect, setLastPlacedCorrect] = useState<number | null>(null);
  const [shakeWrongSlot, setShakeWrongSlot] = useState<number | null>(null);

  const [flyingWords, setFlyingWords] = useState<FlyingWord[]>([]);
  const [nextExpectedPosition, setNextExpectedPosition] = useState(0);
  const [flyingScore, setFlyingScore] = useState(0);
  const [flyingMistakes, setFlyingMistakes] = useState(0);
  const [flyingSpeed, setFlyingSpeed] = useState<'slow' | 'medium' | 'fast'>('slow');

  const [runnerWords, setRunnerWords] = useState<RunnerWord[]>([]);
  const [runnerPosition, setRunnerPosition] = useState(0);
  const [runnerSpeed, setRunnerSpeed] = useState(1);
  const [runnerScore, setRunnerScore] = useState(0);
  const [runnerNextWord, setRunnerNextWord] = useState(0);
  const [runnerFinished, setRunnerFinished] = useState(false);
  const [hareAsking, setHareAsking] = useState(false);
  const [wordChoices, setWordChoices] = useState<RunnerWord[]>([]);
  const [maxPositionReached, setMaxPositionReached] = useState(0);
  const [autoRunning, setAutoRunning] = useState(false);
  const [ribbonBroken, setRibbonBroken] = useState(false);
  const runnerSpeedRef = useRef(1);
  const hasFinishedRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const [balloonWords, setBalloonWords] = useState<BalloonWord[]>([]);
  const [revealedWords, setRevealedWords] = useState<BalloonWord[]>([]);
  const [arrangedWords, setArrangedWords] = useState<(BalloonWord | null)[]>([]);
  const [balloonPhase, setBalloonPhase] = useState<'popping' | 'arranging'>('popping');

  // Race game state
  const [raceWords, setRaceWords] = useState<{ id: number; word: string; position: number }[]>([]);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [raceActive, setRaceActive] = useState(false);
  const [raceResult, setRaceResult] = useState<'none' | 'win' | 'lose'>('none');
  const [raceDifficulty, setRaceDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [userAvatar, setUserAvatar] = useState('🧒');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const avatarOptions = ['🧒', '👦', '👧', '🦸', '🦹', '🐱', '🐶', '🦊', '🐰', '🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🦄', '🐧', '🦋', '🐢', '🦉'];

  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<Badge | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [visitedKurals, setVisitedKurals] = useState<number[]>([]);
  const [newBadgeCount, setNewBadgeCount] = useState(0);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [celebrationType, setCelebrationType] = useState<CelebrationType>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { user, logout } = useAuth();
  const isPaidUser = user?.tier === 'paid';
  const [totalCoins, setTotalCoins] = useState(user?.coins || 0);
  const [userChapters, setUserChapters] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  useEffect(() => {
    if (user?.coins !== undefined) {
      setTotalCoins(user.coins);
    }
  }, [user?.coins]);
  const { emotion: avatarEmotion, react: reactAvatar } = useAvatarEmotion();

  const currentKural = initialKurals[currentKuralIndex];

  const playCompletionAudio = useCallback(() => {
    const audioUrl = currentLanguage === 'tamil'
      ? currentKural?.audio_tamil_url
      : currentKural?.audio_english_url;

    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play().catch(() => { });
    }
  }, [currentKural, currentLanguage]);

  const toggleFavorite = useCallback(() => {
    if (!currentKural) return;
    const id = currentKural.id;
    const profileId = user?.activeProfileId || user?.id || 'guest';
    const bookmarksKey = `thirukural-bookmarks-${profileId}`;

    const next = bookmarks.includes(id)
      ? bookmarks.filter(b => b !== id)
      : [...bookmarks, id];
    setBookmarks(next);
    localStorage.setItem(bookmarksKey, JSON.stringify(next));
    if (user) {
      fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kuralIds: next }),
      }).catch(err => console.error('Failed to sync favorites:', err));
    }
  }, [currentKural, bookmarks, user]);

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil' || savedLang === 'english') {
      setCurrentLanguage(savedLang);
    }

    // Only use saved game mode if no initialGame was provided via URL
    if (!initialGame) {
      const savedGameMode = localStorage.getItem('thirukural-game-mode');
      if (savedGameMode === 'puzzle' || savedGameMode === 'flying' || savedGameMode === 'balloon' || savedGameMode === 'race') {
        setGameMode(savedGameMode);
      }
    }

    const savedAvatar = localStorage.getItem('thirukural-race-avatar');
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    }

    // Load profile-specific bookmarks and visited
    const profileId = user?.activeProfileId || user?.id || 'guest';
    const bookmarksKey = `thirukural-bookmarks-${profileId}`;
    const visitedKey = `thirukural-visited-${profileId}`;

    const savedPuzzleSolved = localStorage.getItem(`thirukural-puzzle-solved-${profileId}`);
    const savedFlyingSolved = localStorage.getItem(`thirukural-flying-solved-${profileId}`);
    const savedRunnerSolved = localStorage.getItem(`thirukural-runner-solved-${profileId}`);
    const savedBalloonSolved = localStorage.getItem(`thirukural-balloon-solved-${profileId}`);
    const puzzleSolved = savedPuzzleSolved ? JSON.parse(savedPuzzleSolved) : [];
    const flyingSolved = savedFlyingSolved ? JSON.parse(savedFlyingSolved) : [];
    const runnerSolved = savedRunnerSolved ? JSON.parse(savedRunnerSolved) : [];
    const balloonSolved = savedBalloonSolved ? JSON.parse(savedBalloonSolved) : [];
    const allSolved = new Set([...puzzleSolved, ...flyingSolved, ...runnerSolved, ...balloonSolved]);
    setSolvedCount(allSolved.size);

    setNewBadgeCount(getUnviewedBadgeCount(user, profileId));

    const savedBookmarks = localStorage.getItem(bookmarksKey);
    if (savedBookmarks) {
      try { setBookmarks(JSON.parse(savedBookmarks)); } catch { /* ignore */ }
    }

    const savedVisited = localStorage.getItem(visitedKey);
    if (savedVisited) {
      try {
        const visited = JSON.parse(savedVisited).map(Number);
        setVisitedKurals(visited);
        setStreakCount(visited.length);
      } catch { }
    }

    if (user) {
      fetch('/api/user/favorites')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setBookmarks(data);
            localStorage.setItem(bookmarksKey, JSON.stringify(data));
          }
        })
        .catch(() => { /* use localStorage fallback */ });
    }

    const { streakData, newBadge } = updateStreak(user, profileId);
    setStreakCount(streakData.currentStreak);
    if (newBadge) {
      saveBadge(newBadge, profileId);
      setNewlyEarnedBadge(newBadge);
      setNewBadgeCount(prev => prev + 1);
    }
    recordDailyVisit(user, profileId);
  }, [user]);

  // Fetch coins and progress initially
  useEffect(() => {
    if (user) {
      const profileId = user.activeProfileId || user.id;
      const visitedKey = `thirukural-visited-${profileId}`;

      fetch('/api/user/coins')
        .then(res => res.json())
        .then(data => { if (data.coins !== undefined) setTotalCoins(data.coins); })
        .catch(e => console.error(e));

      fetch('/api/user/progress')
        .then(res => res.json())
        .then(data => {
          if (data?.completedChapters) {
            const serverVisited = Array.from(new Set(data.completedChapters)).map(Number);
            setVisitedKurals(prev => {
              const merged = Array.from(new Set([...prev, ...serverVisited]));
              localStorage.setItem(visitedKey, JSON.stringify(merged));
              return merged;
            });
            setUserChapters(serverVisited);
          }
        })
        .catch(e => console.error(e));
    }
  }, [user]);

  useEffect(() => {
    if (!currentKural?.id) return;
    const currentId = Number(currentKural.id);

    const profileId = user?.activeProfileId || user?.id || 'guest';
    const visitedKey = `thirukural-visited-${profileId}`;

    setVisitedKurals(prev => {
      if (!prev.includes(currentId)) {
        const updated = Array.from(new Set([...prev, currentId]));
        localStorage.setItem(visitedKey, JSON.stringify(updated));

        // Append-only sync to DB
        fetch('/api/user/progress/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kuralId: currentId })
        }).catch(err => console.error('Visit sync failed', err));

        return updated;
      }
      return prev;
    });
  }, [currentKural?.id, user]);

  const openBadgeModal = () => {
    const profileId = user?.activeProfileId || user?.id || 'guest';
    const allBadges = getAllBadges(user, profileId);
    const unviewedBadges = allBadges.filter(b => !b.viewed);
    setShowBadgeModal(true);
    setNewBadgeCount(0);
  };

  const awardCoins = async (amount: number) => {
    if (!user) return;
    fetch('/api/user/coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    }).then(res => res.json()).then(data => {
      if (data.coins !== undefined) setTotalCoins(data.coins);
    }).catch(e => console.error(e));
  };

  useEffect(() => {
    if (!currentKural) return;
    if (gameMode === 'puzzle') {
      initializePuzzle();
    } else if (gameMode === 'flying') {
      initializeFlyingGame();
    } else if (gameMode === 'balloon') {
      initializeBalloonGame();
    } else if (gameMode === 'race') {
      initializeRaceGame();
    }
  }, [currentKuralIndex, currentKural, gameMode]);

  const initializePuzzle = () => {
    if (!currentKural) return;

    const kuralText = currentKural.kural_tamil;
    const words = kuralText
      .replace(/\\n/g, ' ')
      .replace(/\n/g, ' ')
      .split(/\s+/)
      .filter(word => word.trim().length > 0);

    const pieces: PuzzlePiece[] = words.map((word, index) => ({
      id: `piece-${index}`,
      word: word.trim(),
      correctPosition: index
    }));

    const shuffled = [...pieces].sort(() => Math.random() - 0.5);
    setShuffledPieces(shuffled);
    setPlacedPieces(new Array(pieces.length).fill(null));
    setIsSolved(false);
    setPuzzleTimer(60);
    setPuzzleTimerActive(true);
    setPuzzleStreak(0);
    setPuzzleBonusPoints(0);
    setLastPlacedCorrect(null);
    setShakeWrongSlot(null);
  };

  const initializeFlyingGame = useCallback(() => {
    if (!currentKural) return;

    const profileId = user?.activeProfileId || user?.id || 'guest';
    const savedSolved = localStorage.getItem(`thirukural-flying-solved-${profileId}`);
    const solvedKurals = savedSolved ? JSON.parse(savedSolved) : [];
    const isAlreadySolved = solvedKurals.includes(currentKural.id);

    const kuralText = currentKural.kural_tamil;
    const words = kuralText
      .replace(/\\n/g, ' ')
      .replace(/\n/g, ' ')
      .split(/\s+/)
      .filter(word => word.trim().length > 0);

    const flyingWordsInit: FlyingWord[] = words.map((word, index) => ({
      id: `flying-${index}`,
      word: word.trim(),
      correctPosition: index,
      x: Math.random() * 70 + 10,
      y: Math.random() * 60 + 15,
      dx: (Math.random() - 0.5) * 2,
      dy: (Math.random() - 0.5) * 2,
      isClicked: isAlreadySolved
    }));

    setFlyingWords(flyingWordsInit);
    setNextExpectedPosition(isAlreadySolved ? words.length : 0);
    setFlyingScore(0);
    setFlyingMistakes(0);
    setIsSolved(isAlreadySolved);
  }, [currentKural]);

  const initializeRunnerGame = useCallback(() => {
    if (!currentKural) return;

    const profileId = user?.activeProfileId || user?.id || 'guest';
    const savedSolved = localStorage.getItem(`thirukural-runner-solved-${profileId}`);
    const solvedKurals = savedSolved ? JSON.parse(savedSolved) : [];
    const isAlreadySolved = solvedKurals.includes(currentKural.id);

    const kuralText = currentKural.kural_tamil;
    const words = kuralText
      .replace(/\\n/g, ' ')
      .replace(/\n/g, ' ')
      .split(/\s+/)
      .filter(word => word.trim().length > 0);

    const runnerWordsInit: RunnerWord[] = words.map((word, index) => ({
      id: `runner-${index}`,
      word: word.trim(),
      correctPosition: index,
      isCollected: isAlreadySolved
    }));

    setRunnerWords(runnerWordsInit);
    setRunnerPosition(isAlreadySolved ? 100 : 0);
    setMaxPositionReached(isAlreadySolved ? 100 : 0);
    setAutoRunning(false);
    setRibbonBroken(isAlreadySolved);
    setRunnerSpeed(1);
    runnerSpeedRef.current = 1;
    hasFinishedRef.current = isAlreadySolved;
    setRunnerScore(0);
    setRunnerNextWord(isAlreadySolved ? words.length : 0);
    setRunnerFinished(isAlreadySolved);
    setHareAsking(false);
    setIsSolved(isAlreadySolved);
  }, [currentKural]);

  const initializeBalloonGame = useCallback(() => {
    if (!currentKural) return;

    const profileId = user?.activeProfileId || user?.id || 'guest';
    const savedSolved = localStorage.getItem(`thirukural-balloon-solved-${profileId}`);
    const solvedKurals = savedSolved ? JSON.parse(savedSolved) : [];
    const isAlreadySolved = solvedKurals.includes(currentKural.id);

    const kuralText = currentKural.kural_tamil;
    const words = kuralText
      .replace(/\\n/g, ' ')
      .replace(/\n/g, ' ')
      .split(/\s+/)
      .filter(word => word.trim().length > 0);

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

    const balloonWordsInit: BalloonWord[] = words.map((word, index) => ({
      id: `balloon-${index}`,
      word: word.trim(),
      correctPosition: index,
      isPopped: isAlreadySolved,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 50,
      color: colors[index % colors.length],
      bobOffset: Math.random() * Math.PI * 2
    }));

    setBalloonWords(balloonWordsInit);
    setRevealedWords(isAlreadySolved ? balloonWordsInit : []);
    setArrangedWords(isAlreadySolved ? balloonWordsInit : Array(words.length).fill(null));
    setBalloonPhase(isAlreadySolved ? 'arranging' : 'popping');
    setIsSolved(isAlreadySolved);
  }, [currentKural]);

  const initializeRaceGame = useCallback(() => {
    if (!currentKural) return;

    const kuralText = currentKural.kural_tamil;
    const words = kuralText.replace(/\\n/g, ' ').replace(/\n/g, ' ').split(/\s+/).filter(word => word.trim().length > 0);
    const shuffledWords = words.map((word, index) => ({
      id: index, word: word.trim(), position: index
    })).sort(() => Math.random() - 0.5);
    setRaceWords(shuffledWords);
    setPlayerProgress(0);
    setAiProgress(0);
    setRaceActive(true);
    setRaceResult('none');
    setIsSolved(false);

    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
  }, [currentKural]);

  // AI opponent logic for race game
  useEffect(() => {
    if (gameMode !== 'race' || !raceActive || raceResult !== 'none') return;

    const aiSpeed = raceDifficulty === 'easy' ? 3000 : raceDifficulty === 'hard' ? 1000 : 1800;

    aiIntervalRef.current = setInterval(() => {
      setAiProgress(prev => {
        const totalWords = raceWords.length;
        if (prev + 1 >= totalWords) {
          setRaceResult('lose');
          setRaceActive(false);
          return totalWords;
        }
        return prev + 1;
      });
    }, aiSpeed);

    return () => {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, [gameMode, raceActive, raceResult, raceDifficulty, raceWords.length]);

  const handleRaceWordClick = (word: { id: number; word: string; position: number }) => {
    if (!raceActive || raceResult !== 'none' || !currentKural) return;

    if (word.position === playerProgress) {
      const newProgress = playerProgress + 1;
      setPlayerProgress(newProgress);
      setRaceWords(prev => prev.filter(w => w.id !== word.id));

      const totalWords = raceWords.length + playerProgress;
      if (newProgress >= totalWords) {
        setRaceResult('win');
        setRaceActive(false);
        setIsSolved(true);
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);

        const profileId = user?.activeProfileId || user?.id || 'guest';
        const savedSolved = localStorage.getItem(`thirukural-race-solved-${profileId}`);
        const solvedKurals = savedSolved ? JSON.parse(savedSolved) : [];
        if (!solvedKurals.includes(currentKural.id)) {
          solvedKurals.push(currentKural.id);
          localStorage.setItem(`thirukural-race-solved-${profileId}`, JSON.stringify(solvedKurals));
          handleGameComplete('race');
        }
      }
    }
  };




  const closeBadgeModal = () => {
    setShowBadgeModal(false);
    setCelebrationType(null);
    setNewlyEarnedBadge(null);
  };

  const handleGameComplete = useCallback((game: 'puzzle' | 'flying' | 'balloon' | 'race', timeSeconds?: number) => {
    if (!currentKural) return;

    const profileId = user?.activeProfileId || user?.id || 'guest';
    updateKuralActivity(currentKural.id, game, profileId);

    // Register Quest Chapter completion!
    if (user && initialChapter && !userChapters.includes(initialChapter)) {
      const updatedChapters = [...userChapters, initialChapter];
      setUserChapters(updatedChapters);
      fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedChapters: updatedChapters })
      }).catch(err => console.error('Failed to sync quest completion', err));
      // Award +5 XP bonus for first completion of this chapter
      awardCoins(5);
    }

    const stats = getSkillStats(profileId);

    if (game === 'puzzle' && timeSeconds !== undefined) {
      if (stats.puzzleFastestTime === null || timeSeconds < stats.puzzleFastestTime) {
        stats.puzzleFastestTime = timeSeconds;
        saveSkillStats(stats, profileId);
      }

      const speedBadge = checkSkillBadge('speedDemon', stats, profileId);
      if (speedBadge) {
        saveBadge(speedBadge, profileId);
        setNewlyEarnedBadge(speedBadge);
        setNewBadgeCount(prev => prev + 1);
        setCelebrationType('stars');
      }
    }

    if (game === 'race' && raceResult === 'win') {
      stats.raceWinStreak += 1;
      if (stats.raceWinStreak > stats.maxRaceWinStreak) {
        stats.maxRaceWinStreak = stats.raceWinStreak;
      }
      saveSkillStats(stats, profileId);

      const unbeatableBadge = checkSkillBadge('unbeatable', stats, profileId);
      if (unbeatableBadge) {
        saveBadge(unbeatableBadge, profileId);
        setNewlyEarnedBadge(unbeatableBadge);
        setNewBadgeCount(prev => prev + 1);
        setCelebrationType('fireworks');
      }
    } else if (game === 'race') {
      stats.raceWinStreak = 0;
      saveSkillStats(stats, profileId);
    }

    const masteredCount = getMasteredCount(profileId);
    const masteryBadge = checkMasteryBadge(masteredCount, profileId);
    if (masteryBadge) {
      saveBadge(masteryBadge, profileId);
      setNewlyEarnedBadge(masteryBadge);
      setNewBadgeCount(prev => prev + 1);
      setCelebrationType('confetti');
    }
  }, [currentKural, raceResult]);

  useEffect(() => {
    if (gameMode !== 'flying' || isSolved || flyingWords.length === 0) return;
    const speedMultiplier = flyingSpeed === 'slow' ? 0.5 : flyingSpeed === 'fast' ? 1.8 : 1;
    const intervalTime = flyingSpeed === 'slow' ? 60 : flyingSpeed === 'fast' ? 35 : 50;
    const interval = setInterval(() => {
      setFlyingWords(prev => prev.map(word => {
        if (word.isClicked) return word;
        let newX = word.x + word.dx * speedMultiplier;
        let newY = word.y + word.dy * speedMultiplier;
        let newDx = word.dx;
        let newDy = word.dy;
        if (newX <= 5 || newX >= 85) newDx = -newDx;
        if (newY <= 5 || newY >= 75) newDy = -newDy;
        return { ...word, x: newX, y: newY, dx: newDx, dy: newDy };
      }));
    }, intervalTime);
    return () => clearInterval(interval);
  }, [gameMode, isSolved, flyingWords.length, flyingSpeed]);

  useEffect(() => {
    if (!puzzleTimerActive || isSolved || puzzleTimer <= 0 || gameMode !== 'puzzle') return;
    const timer = setInterval(() => {
      setPuzzleTimer(prev => {
        if (prev <= 1) {
          setPuzzleTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [puzzleTimerActive, isSolved, puzzleTimer, gameMode]);

  const handleTrackMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameMode !== 'race' || runnerFinished || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const trackWidth = rect.width;
    const mousePercentage = (mouseX / trackWidth) * 100;

    const totalWords = runnerWords.length || 1;
    const harePosition = (runnerNextWord / totalWords) * 100;

    const maxAllowedPosition = runnerNextWord >= totalWords ? 100 : harePosition;
    const newPosition = Math.max(maxPositionReached, Math.min(mousePercentage, maxAllowedPosition));

    if (newPosition > maxPositionReached) {
      setMaxPositionReached(newPosition);
    }
    setRunnerPosition(newPosition);

    if (runnerNextWord >= totalWords && newPosition >= 98 && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      setIsSolved(true);
      setPuzzleTimerActive(false); // This line seems out of place for runner game
      if (user) awardCoins(1);
      reactAvatar('happy');
      playCompletionAudio();
      setSolvedCount(prevCount => prevCount + 1);

      const profileId = user?.activeProfileId || user?.id || 'guest';
      const savedSolved = localStorage.getItem(`thirukural-runner-solved-${profileId}`);
      const solved = savedSolved ? JSON.parse(savedSolved) : [];
      if (!solved.includes(currentKural?.id)) {
        solved.push(currentKural?.id);
        localStorage.setItem(`thirukural-runner-solved-${profileId}`, JSON.stringify(solved));
      }
    }
  }, [gameMode, runnerFinished, runnerNextWord, runnerWords.length, currentKural, maxPositionReached, playCompletionAudio, user]);

  useEffect(() => {
    if (!autoRunning || runnerFinished) return;

    const interval = setInterval(() => {
      setRunnerPosition(prev => {
        const newPos = prev + 2;

        if (newPos >= 85 && !ribbonBroken) {
          setRibbonBroken(true);
        }

        if (newPos >= 100) {
          if (!hasFinishedRef.current) {
            hasFinishedRef.current = true;
            setRunnerFinished(true);
            setIsSolved(true);
            setShowMeaning(true);
            playCompletionAudio();
            setSolvedCount(prevCount => prevCount + 1);

            const profileId = user?.activeProfileId || user?.id || 'guest';
            const savedSolved = localStorage.getItem(`thirukural-runner-solved-${profileId}`);
            const solved = savedSolved ? JSON.parse(savedSolved) : [];
            if (!solved.includes(currentKural?.id)) {
              solved.push(currentKural?.id);
              localStorage.setItem(`thirukural-runner-solved-${profileId}`, JSON.stringify(solved));
              setTimeout(() => handleGameComplete('race'), 100);
            }
          }
          return 100;
        }
        return newPos;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [autoRunning, runnerFinished, ribbonBroken, currentKural, playCompletionAudio, handleGameComplete]);

  useEffect(() => {
    if (placedPieces.length === 0) return;

    const allPlaced = placedPieces.every(piece => piece !== null);
    if (!allPlaced) return;

    const isCorrect = placedPieces.every((piece, index) =>
      piece !== null && piece.correctPosition === index
    );

    if (isCorrect && !isSolved) {
      setIsSolved(true);
      setPuzzleTimerActive(false);
      const timeBonus = puzzleTimer * 2;
      setPuzzleBonusPoints(prev => prev + timeBonus);
      setShowMeaning(true);
      playCompletionAudio();

      const profileId = user?.activeProfileId || user?.id || 'guest';
      const savedSolved = localStorage.getItem(`thirukural-puzzle-solved-${profileId}`);
      const solvedKurals = savedSolved ? JSON.parse(savedSolved) : [];
      if (!solvedKurals.includes(currentKural?.id)) {
        const uniqueSolved = new Set([...solvedKurals, currentKural.id]);
        localStorage.setItem(`thirukural-puzzle-solved-${profileId}`, JSON.stringify(Array.from(uniqueSolved)));
        setSolvedCount(uniqueSolved.size);

        if (user) {
          awardCoins(1); // Give 1 coin for solving
          reactAvatar('excited');
        }

        setTimeout(() => handleGameComplete('puzzle', puzzleTimer > 0 ? 120 - puzzleTimer : undefined), 100);
      }
    }
  }, [placedPieces, isSolved, currentKural, playCompletionAudio, puzzleTimer, handleGameComplete, user]);

  const handlePieceClick = (piece: PuzzlePiece) => {
    const emptySlotIndex = placedPieces.findIndex(p => p === null);
    if (emptySlotIndex !== -1) {
      const isCorrectPlacement = piece.correctPosition === emptySlotIndex;
      const newPlacedPieces = [...placedPieces];
      newPlacedPieces[emptySlotIndex] = piece;
      setPlacedPieces(newPlacedPieces);
      setShuffledPieces(prev => prev.filter(p => p.id !== piece.id));

      if (isCorrectPlacement) {
        setLastPlacedCorrect(emptySlotIndex);
        setPuzzleStreak(prev => prev + 1);
        const bonusMultiplier = Math.min(puzzleStreak + 1, 5);
        setPuzzleBonusPoints(prev => prev + (10 * bonusMultiplier));
        setTimeout(() => setLastPlacedCorrect(null), 500);
      } else {
        setPuzzleStreak(0);
        setShakeWrongSlot(emptySlotIndex);
        setTimeout(() => setShakeWrongSlot(null), 500);
      }
    }
  };

  const handleSlotClick = (slotIndex: number) => {
    const piece = placedPieces[slotIndex];
    if (piece) {
      const newPlacedPieces = [...placedPieces];
      newPlacedPieces[slotIndex] = null;
      setPlacedPieces(newPlacedPieces);
      setShuffledPieces(prev => [...prev, piece]);
    }
  };

  const handleFlyingWordClick = (word: FlyingWord) => {
    if (word.isClicked || isSolved) return;

    if (word.correctPosition === nextExpectedPosition) {
      reactAvatar('happy');
      const newClickedWords = flyingWords.map(w =>
        w.id === word.id ? { ...w, isClicked: true } : w
      );
      setFlyingWords(newClickedWords);

      const newPosition = nextExpectedPosition + 1;
      setNextExpectedPosition(newPosition);
      setFlyingScore(prev => prev + 10);

      const totalWords = flyingWords.length;
      if (newPosition === totalWords) {
        setIsSolved(true);
        setShowMeaning(true);
        playCompletionAudio();
        setSolvedCount(prev => prev + 1);

        const savedSolved = localStorage.getItem('thirukural-flying-solved');
        const solved = savedSolved ? JSON.parse(savedSolved) : [];
        if (!solved.includes(currentKural?.id)) {
          solved.push(currentKural?.id);
          localStorage.setItem('thirukural-flying-solved', JSON.stringify(solved));
          setTimeout(() => handleGameComplete('flying'), 100);
        }
      }
    } else {
      reactAvatar('sad');
      setFlyingMistakes(prev => prev + 1);
      setFlyingScore(prev => Math.max(0, prev - 5));
    }
  };

  const handleRunnerWordClick = (word: RunnerWord) => {
    if (word.isCollected || runnerFinished || !hareAsking) return;

    if (word.correctPosition === runnerNextWord) {
      setRunnerWords(prev => prev.map(w =>
        w.id === word.id ? { ...w, isCollected: true } : w
      ));
      const newNextWord = runnerNextWord + 1;
      setRunnerNextWord(newNextWord);
      setRunnerScore(prev => prev + 15);
      const newSpeed = Math.min(3, runnerSpeedRef.current + 0.5);
      runnerSpeedRef.current = newSpeed;
      setRunnerSpeed(newSpeed);
      reactAvatar('happy');
      setHareAsking(false);

      if (newNextWord >= runnerWords.length) {
        setAutoRunning(true);
      }
    } else {
      reactAvatar('sad');
      const newSpeed = Math.max(0.2, runnerSpeedRef.current - 0.3);
      runnerSpeedRef.current = newSpeed;
      setRunnerSpeed(newSpeed);
      setRunnerScore(prev => Math.max(0, prev - 5));
    }
  };

  const handleHareSpeak = () => {
    const correctWord = runnerWords.find(w => w.correctPosition === runnerNextWord);
    const incorrectWords = runnerWords
      .filter(w => !w.isCollected && w.correctPosition !== runnerNextWord)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const choices = correctWord
      ? [correctWord, ...incorrectWords].sort(() => Math.random() - 0.5)
      : incorrectWords;
    setWordChoices(choices);
    reactAvatar('thinking');
    setHareAsking(true);
  };

  const handleBalloonPop = (balloon: BalloonWord) => {
    if (balloon.isPopped || isSolved) return;

    setBalloonWords(prev => {
      const updated = prev.map(b =>
        b.id === balloon.id ? { ...b, isPopped: true } : b
      );
      if (updated.every(b => b.isPopped)) {
        setTimeout(() => setBalloonPhase('arranging'), 500);
      }
      return updated;
    });
    setRevealedWords(prev => [...prev, balloon]);
  };

  const handleArrangeWord = (word: BalloonWord, slotIndex: number) => {
    if (isSolved) return;

    const newArranged = [...arrangedWords];
    const existingIndex = newArranged.findIndex(w => w?.id === word.id);
    if (existingIndex !== -1) {
      newArranged[existingIndex] = null;
    }

    if (newArranged[slotIndex] !== null) {
      setRevealedWords(prev => [...prev, newArranged[slotIndex]!]);
    }

    newArranged[slotIndex] = word;
    setArrangedWords(newArranged);
    setRevealedWords(prev => prev.filter(w => w.id !== word.id));

    if (newArranged.every(w => w !== null)) {
      const isCorrect = newArranged.every((w, i) => w?.correctPosition === i);
      if (isCorrect) {
        setIsSolved(true);
        setShowMeaning(true);
        playCompletionAudio();
        setSolvedCount(prev => prev + 1);

        const savedSolved = localStorage.getItem('thirukural-balloon-solved');
        const solved = savedSolved ? JSON.parse(savedSolved) : [];
        if (!solved.includes(currentKural?.id)) {
          solved.push(currentKural?.id);
          localStorage.setItem('thirukural-balloon-solved', JSON.stringify(solved));
          setTimeout(() => handleGameComplete('balloon'), 100);
        }
      }
    }
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    if (isSolved) return;
    const word = arrangedWords[slotIndex];
    if (word) {
      const newArranged = [...arrangedWords];
      newArranged[slotIndex] = null;
      setArrangedWords(newArranged);
      setRevealedWords(prev => [...prev, word]);
    }
  };

  const nextKural = () => {
    if (currentKuralIndex < initialKurals.length - 1) {
      setCurrentKuralIndex(currentKuralIndex + 1);
      setShowMeaning(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const previousKural = () => {
    if (currentKuralIndex > 0) {
      setCurrentKuralIndex(currentKuralIndex - 1);
      setShowMeaning(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'tamil' ? 'english' : 'tamil';
    setCurrentLanguage(newLang);
    localStorage.setItem('thirukural-language', newLang);
    window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: newLang === 'tamil' } }));
  };

  const resetCurrentGame = () => {
    setShowMeaning(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (gameMode === 'puzzle') {
      initializePuzzle();
    } else if (gameMode === 'flying') {
      initializeFlyingGame();
    } else if (gameMode === 'balloon') {
      initializeBalloonGame();
    } else if (gameMode === 'race') {
      initializeRaceGame();
    }
  };

  const resetAllProgress = () => {
    localStorage.removeItem('thirukural-puzzle-solved');
    localStorage.removeItem('thirukural-flying-solved');
    localStorage.removeItem('thirukural-runner-solved');
    localStorage.removeItem('thirukural-balloon-solved');
    localStorage.removeItem('thirukural-game-badges');
    localStorage.removeItem('thirukural-all-badges');
    localStorage.removeItem('thirukural-kural-progress');
    localStorage.removeItem('thirukural-skill-stats');
    setSolvedCount(0);
    setNewBadgeCount(0);
    setIsSolved(false);
    setShowMeaning(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (gameMode === 'puzzle') {
      initializePuzzle();
    } else if (gameMode === 'flying') {
      initializeFlyingGame();
    } else if (gameMode === 'balloon') {
      initializeBalloonGame();
    } else if (gameMode === 'race') {
      initializeRaceGame();
    }
  };

  if (!currentKural) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <p className="text-gray-600">No kurals available</p>
      </div>
    );
  }

  return (
    <div className={`${isEmbed ? '' : 'min-h-screen'} bg-gradient-to-br from-yellow-50 to-orange-100 relative`}>
      {!isEmbed && (
        <PageHeader
          gradientClass="bg-gradient-to-r from-purple-600 to-violet-600"
          title={currentLanguage === 'tamil' ? `திருக்குறள் ${currentKural.id}` : `Thirukkural ${currentKural.id}`}
          onLoginClick={() => setShowAuthModal(true)}
          onUpgradeClick={() => setShowPricingModal(true)}
          onBadgesClick={openBadgeModal}
          newBadgeCount={newBadgeCount}
          isTamil={currentLanguage === 'tamil'}
          toggleLanguage={() => {
            const next = currentLanguage === 'tamil' ? 'english' : 'tamil';
            setCurrentLanguage(next);
            localStorage.setItem('thirukural-language', next);
          }}
          onToggleFavorite={toggleFavorite}
          isFavorited={bookmarks.includes(currentKural?.id)}
          onStreakClick={() => setShowNavModal(true)}
          streakCount={new Set(visitedKurals).size}
          coinCount={totalCoins}
          onCoinClick={openBadgeModal}
        />
      )}

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Game Mode Selector - Moved from Header to Body */}
        {!isEmbed && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 bg-purple-50 p-3 rounded-2xl border border-purple-100 shadow-sm">
            <button
              onClick={() => { setGameMode('puzzle'); localStorage.setItem('thirukural-game-mode', 'puzzle'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${gameMode === 'puzzle'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white text-purple-600 hover:bg-purple-100 border border-purple-200'
                }`}
            >
              <span>🧩</span>
              <span className="hidden sm:inline">{currentLanguage === 'tamil' ? 'புதிர்' : 'Puzzle'}</span>
            </button>
            <button
              onClick={() => { setGameMode('flying'); localStorage.setItem('thirukural-game-mode', 'flying'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${gameMode === 'flying'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                : 'bg-white text-blue-600 hover:bg-blue-100 border border-blue-200'
                }`}
            >
              <span>🦋</span>
              <span className="hidden sm:inline">{currentLanguage === 'tamil' ? 'பறக்கும்' : 'Flying'}</span>
            </button>
            <button
              onClick={() => { setGameMode('balloon'); localStorage.setItem('thirukural-game-mode', 'balloon'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${gameMode === 'balloon'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105'
                : 'bg-white text-red-600 hover:bg-red-100 border border-red-200'
                }`}
            >
              <span>🎈</span>
              <span className="hidden sm:inline">{currentLanguage === 'tamil' ? 'பலூன்' : 'Balloon'}</span>
            </button>
            <button
              onClick={() => { setGameMode('race'); localStorage.setItem('thirukural-game-mode', 'race'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${gameMode === 'race'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                : 'bg-white text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                }`}
            >
              <span>🏁</span>
              <span className="hidden sm:inline">{currentLanguage === 'tamil' ? 'போட்டி' : 'Race'}</span>
            </button>
          </div>
        )}
        {gameMode === 'puzzle' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-800 text-sm">
                  {currentLanguage === 'tamil'
                    ? '📝 சொற்களை சரியான வரிசையில் அமைக்கவும்'
                    : '📝 Arrange words in correct order'}
                </p>
                {isSolved && (
                  <div className="flex items-center text-green-600">
                    <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span className="font-semibold text-sm">
                      {currentLanguage === 'tamil' ? 'சரி!' : 'Solved!'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${puzzleTimer <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-blue-600'
                  }`}>
                  ⏱️ {puzzleTimer}s
                </div>
                {puzzleStreak > 0 && (
                  <div className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-white text-sm font-bold animate-bounce">
                    🔥 x{puzzleStreak} {currentLanguage === 'tamil' ? 'தொடர்!' : 'Streak!'}
                  </div>
                )}
                {puzzleBonusPoints > 0 && (
                  <div className="text-green-600 font-bold text-sm">+{puzzleBonusPoints} pts</div>
                )}
              </div>
            </div>

            <div className="px-6 py-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">
                {currentLanguage === 'tamil' ? 'குறள் உருவாக்குங்கள்:' : 'Build the Kural:'}
              </h3>
              <div className="flex flex-wrap gap-2 min-h-[80px] p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                {placedPieces.map((piece, index) => (
                  <button
                    key={`slot-${index}`}
                    className={`min-w-[60px] min-h-[44px] flex items-center justify-center rounded-lg border-2 transition-all cursor-pointer relative
                      ${piece
                        ? isSolved
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : lastPlacedCorrect === index
                            ? 'bg-green-200 border-green-500 text-green-800 scale-110'
                            : 'bg-yellow-100 border-yellow-400 text-yellow-800'
                        : 'bg-white border-gray-300 border-dashed'
                      }`}
                    onClick={() => handleSlotClick(index)}
                    style={shakeWrongSlot === index ? { animation: 'shake 0.5s ease-in-out' } : {}}
                  >
                    {piece ? (
                      <span className="px-3 py-2 font-tamil text-lg font-medium">
                        {piece.word}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">{index + 1}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-600 mb-3">
                {currentLanguage === 'tamil' ? 'சொற்கள்:' : 'Words:'}
              </h3>
              <div className="flex flex-wrap gap-3 min-h-[60px]">
                {shuffledPieces.map((piece) => (
                  <button
                    key={piece.id}
                    onClick={() => handlePieceClick(piece)}
                    className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-lg font-tamil text-lg font-medium cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105 animate-wiggle flex items-center"
                  >
                    {piece.word}
                  </button>
                ))}
                {shuffledPieces.length === 0 && !isSolved && (
                  <p className="text-gray-500 italic text-sm">
                    {currentLanguage === 'tamil'
                      ? 'எல்லா சொற்களும் வைக்கப்பட்டுவிட்டன'
                      : 'All words have been placed'}
                  </p>
                )}
              </div>
            </div>

            {isSolved && currentKural && (
              <div className="px-6 py-6 bg-green-50 border-t border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  {currentLanguage === 'tamil' ? 'பொருள்:' : 'Meaning:'}
                </h3>
                <p className="text-green-700">
                  {currentLanguage === 'tamil' ? currentKural.meaning_tamil : currentKural.meaning_english}
                </p>
              </div>
            )}
          </div>
        )}

        {gameMode === 'flying' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-800 text-sm">
                  {currentLanguage === 'tamil'
                    ? '🎯 பறக்கும் சொற்களை சரியான வரிசையில் கிளிக் செய்யுங்கள்!'
                    : '🎯 Click the flying words in the correct order!'}
                </p>
                <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
                  <button
                    onClick={() => setFlyingSpeed('slow')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${flyingSpeed === 'slow'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    title={currentLanguage === 'tamil' ? 'மெதுவாக' : 'Slow'}
                  >
                    🐢
                  </button>
                  <button
                    onClick={() => setFlyingSpeed('medium')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${flyingSpeed === 'medium'
                      ? 'bg-yellow-500 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    title={currentLanguage === 'tamil' ? 'நடுத்தரம்' : 'Medium'}
                  >
                    🐇
                  </button>
                  <button
                    onClick={() => setFlyingSpeed('fast')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${flyingSpeed === 'fast'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    title={currentLanguage === 'tamil' ? 'வேகமாக' : 'Fast'}
                  >
                    🚀
                  </button>
                </div>
              </div>
              <p className="text-purple-600 text-xs">
                {currentLanguage === 'tamil'
                  ? `அடுத்த சொல்: ${nextExpectedPosition + 1} / ${flyingWords.length}`
                  : `Click word #${nextExpectedPosition + 1}`}
              </p>
            </div>

            <div className="relative h-[350px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
              {flyingWords.map((word) => (
                <button
                  key={word.id}
                  onClick={() => handleFlyingWordClick(word)}
                  className={`absolute px-4 py-2 rounded-xl font-tamil text-lg font-medium cursor-pointer shadow-md transition-all duration-200
                    ${word.isClicked
                      ? 'bg-green-400 text-white opacity-50 cursor-default scale-90'
                      : 'bg-purple-500 text-white flying-word-glow hover:scale-105 hover:bg-purple-600'
                    }`}
                  style={{
                    left: `${word.x}%`,
                    top: `${word.y}%`
                  }}
                  disabled={word.isClicked}
                >
                  {word.word}
                </button>
              ))}

              {isSolved && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-100/80">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-2xl font-bold text-green-700">
                      {currentLanguage === 'tamil' ? 'சரி!' : 'Completed!'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isSolved && currentKural && (
              <div className="px-6 py-6 bg-green-50 border-t border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  {currentLanguage === 'tamil' ? 'பொருள்:' : 'Meaning:'}
                </h3>
                <p className="text-green-700">
                  {currentLanguage === 'tamil' ? currentKural.meaning_tamil : currentKural.meaning_english}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Balloon Game Mode */}
        {gameMode === 'balloon' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-red-300">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-red-800 text-sm">
                  {balloonPhase === 'popping'
                    ? (currentLanguage === 'tamil'
                      ? '🎈 பலூன்களை கிளிக் செய்து உள்ளே மறைந்திருக்கும் சொற்களைக் கண்டறியுங்கள்!'
                      : '🎈 Click on balloons to pop them and discover the hidden words inside!')
                    : (currentLanguage === 'tamil'
                      ? '📝 கண்டறிந்த சொற்களை சரியான வரிசையில் வைக்கவும்'
                      : '📝 Arrange the discovered words in the correct order to form the kural')}
                </p>
                <span className="text-orange-600 text-xs font-bold whitespace-nowrap ml-4">
                  {balloonPhase === 'popping'
                    ? (currentLanguage === 'tamil' ? 'பலூன்களை உடை!' : 'Pop the balloons!')
                    : (currentLanguage === 'tamil' ? 'சொற்களை வரிசைப்படுத்து' : 'Arrange the words')}
                </span>
              </div>
            </div>

            {/* Balloon popping area */}
            {balloonPhase === 'popping' && (
              <div className="relative h-80 bg-gradient-to-b from-sky-300 via-sky-200 to-pink-100 overflow-hidden">
                {/* Clouds */}
                <div className="absolute top-4 left-8 text-4xl opacity-70">☁️</div>
                <div className="absolute top-12 right-16 text-3xl opacity-60">☁️</div>
                <div className="absolute top-6 left-1/2 text-5xl opacity-50">☁️</div>

                {/* Sun */}
                <div className="absolute top-4 right-4 text-5xl">☀️</div>

                {/* Floating sparkles */}
                <div className="absolute top-20 left-12 text-xl opacity-60" style={{ animation: 'sparkle 2s ease-in-out infinite' }}>✨</div>
                <div className="absolute top-32 right-20 text-lg opacity-50" style={{ animation: 'sparkle 2s ease-in-out infinite 0.5s' }}>⭐</div>
                <div className="absolute bottom-20 left-1/3 text-xl opacity-40" style={{ animation: 'sparkle 2s ease-in-out infinite 1s' }}>✨</div>

                {/* Balloons */}
                {balloonWords.map((balloon) => (
                  <button
                    key={balloon.id}
                    type="button"
                    className={`absolute cursor-pointer transition-all duration-300 p-2 -m-2 sparkle-effect ${balloon.isPopped
                      ? 'balloon-pop pointer-events-none'
                      : 'balloon-hover active:scale-90'
                      }`}
                    style={{
                      left: `${balloon.x}%`,
                      top: `${balloon.y}%`,
                      animation: balloon.isPopped ? 'none' : `bounce 2s ease-in-out infinite`,
                      animationDelay: `${balloon.bobOffset * 200}ms`,
                    }}
                    onClick={() => handleBalloonPop(balloon)}
                  >
                    <div className="relative pointer-events-none">
                      {/* Balloon body */}
                      <div
                        className="w-16 h-20 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-lg relative overflow-hidden"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${balloon.color}ff, ${balloon.color}dd, ${balloon.color}aa)`,
                          boxShadow: `0 4px 20px ${balloon.color}88, 0 0 30px ${balloon.color}44`
                        }}
                      >
                        <span className="text-2xl drop-shadow-lg">?</span>
                        {/* Balloon highlight */}
                        <div className="absolute top-2 left-3 w-4 h-6 bg-white/40 rounded-full transform rotate-45" />
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }} />
                      </div>
                      {/* Balloon knot */}
                      <div
                        className="w-4 h-3 mx-auto -mt-1"
                        style={{
                          background: balloon.color,
                          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                        }}
                      />
                      {/* Balloon string */}
                      <div className="w-0.5 h-12 mx-auto" style={{
                        background: 'linear-gradient(to bottom, #9ca3af, transparent)'
                      }} />
                    </div>
                  </button>
                ))}

                {/* Revealed words floating up */}
                {revealedWords.map((word, i) => (
                  <div
                    key={`revealed-${word.id}`}
                    className="absolute animate-bounce bg-white/90 px-3 py-1 rounded-full shadow-lg border-2"
                    style={{
                      left: `${10 + (i * 15) % 80}%`,
                      bottom: '60px',
                      borderColor: word.color,
                      animationDelay: `${i * 0.1}s`
                    }}
                  >
                    <span className="font-bold text-gray-800">{word.word}</span>
                  </div>
                ))}

                {/* Progress indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-lg">
                  <span className="text-red-700 font-semibold">
                    {balloonWords.filter(b => b.isPopped).length} / {balloonWords.length}
                    {currentLanguage === 'tamil' ? ' பலூன்கள் உடைக்கப்பட்டன' : ' balloons popped'}
                  </span>
                </div>
              </div>
            )}

            {/* Word arrangement area */}
            {balloonPhase === 'arranging' && (
              <div className="p-6 bg-gradient-to-b from-orange-50 to-yellow-50">
                {/* Revealed words pool */}
                <div className="mb-6">
                  <p className="text-sm text-orange-700 mb-3 font-medium">
                    {currentLanguage === 'tamil' ? '📦 கண்டறிந்த சொற்கள்:' : '📦 Discovered words:'}
                  </p>
                  <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-white rounded-xl border-2 border-dashed border-orange-300">
                    {revealedWords.map(word => (
                      <button
                        key={word.id}
                        className="px-4 py-2 rounded-lg font-medium shadow-md hover:scale-105 transition-transform"
                        style={{ background: word.color, color: getTextColorForBackground(word.color) }}
                        onClick={() => {
                          const firstEmptySlot = arrangedWords.findIndex(w => w === null);
                          if (firstEmptySlot !== -1) {
                            handleArrangeWord(word, firstEmptySlot);
                          }
                        }}
                      >
                        {word.word}
                      </button>
                    ))}
                    {revealedWords.length === 0 && !isSolved && (
                      <span className="text-gray-400 italic">
                        {currentLanguage === 'tamil' ? 'சொற்களை கீழே வைக்கவும்' : 'Place words in slots below'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrangement slots */}
                <div className="mb-4">
                  <p className="text-sm text-orange-700 mb-3 font-medium">
                    {currentLanguage === 'tamil' ? '📝 குறள் வரிசை:' : '📝 Kural sequence:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {arrangedWords.map((word, index) => (
                      <div
                        key={index}
                        className={`min-w-20 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${word
                          ? 'border-solid cursor-pointer hover:opacity-80'
                          : 'border-dashed border-orange-400 bg-orange-100/50'
                          } ${isSolved ? 'border-green-500 bg-green-100' : ''}`}
                        style={word ? {
                          background: word.color,
                          borderColor: word.color,
                          color: getTextColorForBackground(word.color)
                        } : {}}
                        onClick={() => word && handleRemoveFromSlot(index)}
                      >
                        {word ? (
                          <span className="font-medium px-3">{word.word}</span>
                        ) : (
                          <span className="text-orange-400 text-sm">{index + 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success message */}
                {isSolved && (
                  <div className="mt-4 p-4 bg-green-100 rounded-xl border-2 border-green-400 text-center">
                    <div className="text-4xl mb-2">🎉🎈✨</div>
                    <p className="text-green-700 font-bold text-lg">
                      {currentLanguage === 'tamil' ? 'அருமை! குறள் சரியாக அமைந்தது!' : 'Wonderful! You formed the kural correctly!'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Meaning section when solved */}
            {isSolved && (
              <div className="px-6 py-6 bg-gradient-to-r from-red-50 to-orange-50 border-t border-red-300">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  {currentLanguage === 'tamil' ? '📜 பொருள்:' : '📜 Meaning:'}
                </h3>
                <p className="text-red-700">
                  {currentLanguage === 'tamil' ? currentKural.meaning_tamil : currentKural.meaning_english}
                </p>
              </div>
            )}
          </div>
        )}

        {/* VS AI Race Game */}
        {gameMode === 'race' && currentKural && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <p className="text-emerald-700 text-sm font-medium">
                  {currentLanguage === 'tamil'
                    ? '🏃 எதிராளியுடன் போட்டியிட்டு வேகமாக சொற்களை கிளிக் செய்யுங்கள்!'
                    : '🏃 Race against the opponent and click the words fast!'}
                </p>
                <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-sm self-start sm:self-auto">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1 ml-1">{currentLanguage === 'tamil' ? 'நிலை:' : 'LVL:'}</span>
                  <button
                    onClick={() => { setRaceDifficulty('easy'); initializeRaceGame(); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${raceDifficulty === 'easy' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-white'
                      }`}
                    title={currentLanguage === 'tamil' ? 'எளிது' : 'Easy'}
                  >
                    😊
                  </button>
                  <button
                    onClick={() => { setRaceDifficulty('medium'); initializeRaceGame(); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${raceDifficulty === 'medium' ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-500 hover:bg-white'
                      }`}
                    title={currentLanguage === 'tamil' ? 'நடுத்தரம்' : 'Medium'}
                  >
                    😎
                  </button>
                  <button
                    onClick={() => { setRaceDifficulty('hard'); initializeRaceGame(); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${raceDifficulty === 'hard' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-white'
                      }`}
                    title={currentLanguage === 'tamil' ? 'கடினம்' : 'Hard'}
                  >
                    🤖
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* Avatar Selection Button */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-emerald-700 text-sm">
                  {currentLanguage === 'tamil'
                    ? '🏁 ரோபோவை வெல்லுங்கள்!'
                    : '🏁 Beat the Robot!'}
                </p>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-emerald-300 rounded-full hover:bg-emerald-50 transition-all"
                >
                  <span className="text-2xl">{userAvatar}</span>
                  <span className="text-xs text-emerald-600">{currentLanguage === 'tamil' ? 'அவதாரம்' : 'Avatar'}</span>
                </button>
              </div>

              {/* Forest Race Track */}
              <div className="relative h-96 rounded-xl mb-4 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8C8 35%, #228B22 65%, #1a5c1a 100%)' }}>
                {/* Sky elements */}
                <div className="absolute top-4 left-6 text-4xl opacity-80">☁️</div>
                <div className="absolute top-8 left-1/3 text-3xl opacity-60">☁️</div>
                <div className="absolute top-3 right-1/4 text-5xl opacity-70">☁️</div>
                <div className="absolute top-6 right-8 text-5xl">🌞</div>

                {/* Background trees */}
                <div className="absolute bottom-28 left-2 text-5xl">🌲</div>
                <div className="absolute bottom-32 left-14 text-6xl">🌳</div>
                <div className="absolute bottom-28 left-28 text-5xl">🌲</div>
                <div className="absolute bottom-36 left-1/3 text-6xl">🌳</div>
                <div className="absolute bottom-28 right-1/3 text-5xl">🌲</div>
                <div className="absolute bottom-32 right-24 text-6xl">🌳</div>
                <div className="absolute bottom-28 right-10 text-5xl">🌲</div>
                <div className="absolute bottom-40 left-1/2 -translate-x-1/2 text-7xl">🌳</div>

                {/* Flowers and mushrooms */}
                <div className="absolute bottom-16 left-20 text-xl">🌸</div>
                <div className="absolute bottom-14 left-1/4 text-2xl">🍄</div>
                <div className="absolute bottom-16 right-1/3 text-xl">🌺</div>
                <div className="absolute bottom-14 right-24 text-2xl">🍄</div>
                <div className="absolute bottom-18 left-1/2 text-xl">🌼</div>

                {/* Wide winding dirt path with two lanes - SVG */}
                <svg className="absolute bottom-0 left-0 right-0 h-48 w-full" viewBox="0 0 400 140" preserveAspectRatio="none">
                  {/* Wide path shadow */}
                  <path
                    d="M -10 115 Q 50 70, 100 90 T 200 75 T 300 95 T 410 60"
                    stroke="#4a3728"
                    strokeWidth="60"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Main wide path */}
                  <path
                    d="M -10 115 Q 50 70, 100 90 T 200 75 T 300 95 T 410 60"
                    stroke="#8B7355"
                    strokeWidth="52"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Lane divider */}
                  <path
                    d="M -10 115 Q 50 70, 100 90 T 200 75 T 300 95 T 410 60"
                    stroke="#a08060"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="15 10"
                  />
                </svg>

                {/* Start flag */}
                <div className="absolute bottom-24 left-4 text-3xl">🚩</div>

                {/* Finish line */}
                <div className="absolute bottom-16 right-6 flex flex-col items-center">
                  <div className="text-3xl">🏁</div>
                  <div className="w-1.5 h-14 bg-gradient-to-b from-red-500 via-white to-red-500 rounded" />
                </div>

                {/* Player running on upper lane */}
                <div
                  className="absolute text-5xl transition-all duration-500 ease-out animate-run drop-shadow-lg"
                  style={{
                    left: `${Math.min(3 + (playerProgress / (raceWords.length + playerProgress || 1)) * 82, 85)}%`,
                    bottom: `${64 + Math.sin((playerProgress / (raceWords.length + playerProgress || 1)) * Math.PI * 2) * 10}px`,
                    transform: 'scaleX(-1)'
                  }}
                >
                  {userAvatar}
                </div>

                {/* Robot running on lower lane */}
                <div
                  className="absolute text-5xl transition-all duration-500 ease-out animate-run drop-shadow-lg"
                  style={{
                    left: `${Math.min(3 + (aiProgress / (raceWords.length + playerProgress || 1)) * 82, 85)}%`,
                    bottom: `${24 + Math.sin((aiProgress / (raceWords.length + playerProgress || 1)) * Math.PI * 2) * 10}px`
                  }}
                >
                  🤖
                </div>

                {/* Player label */}
                <div className="absolute top-3 left-3 bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                  <span style={{ transform: 'scaleX(-1)' }}>{userAvatar}</span> {playerProgress}
                </div>

                {/* Robot label */}
                <div className="absolute top-3 right-3 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                  🤖 {aiProgress}
                </div>
              </div>

              {/* Word Pool */}
              {raceResult === 'none' && (
                <div>
                  <p className="text-emerald-700 text-sm mb-3 text-center">
                    {currentLanguage === 'tamil'
                      ? `சொல் #${playerProgress + 1} ஐத் தேர்ந்தெடுக்கவும்`
                      : `Select word #${playerProgress + 1}`}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {raceWords.map((word) => (
                      <button
                        key={word.id}
                        onClick={() => handleRaceWordClick(word)}
                        className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white px-4 py-2 rounded-xl font-tamil text-lg font-medium cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        {word.word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Win Result */}
              {raceResult === 'win' && (
                <div className="text-center py-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl relative overflow-hidden">
                  {/* Sparkle effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <span className="absolute text-2xl animate-twinkle" style={{ top: '10%', left: '15%', animationDelay: '0s' }}>✨</span>
                    <span className="absolute text-xl animate-twinkle" style={{ top: '20%', right: '20%', animationDelay: '0.2s' }}>⭐</span>
                    <span className="absolute text-2xl animate-twinkle" style={{ top: '50%', left: '10%', animationDelay: '0.4s' }}>✨</span>
                    <span className="absolute text-xl animate-twinkle" style={{ top: '30%', right: '10%', animationDelay: '0.6s' }}>🌟</span>
                    <span className="absolute text-2xl animate-twinkle" style={{ bottom: '20%', left: '20%', animationDelay: '0.3s' }}>⭐</span>
                    <span className="absolute text-xl animate-twinkle" style={{ bottom: '25%', right: '15%', animationDelay: '0.5s' }}>✨</span>
                    <span className="absolute text-2xl animate-twinkle" style={{ top: '15%', left: '45%', animationDelay: '0.7s' }}>🌟</span>
                    <span className="absolute text-xl animate-twinkle" style={{ bottom: '15%', right: '40%', animationDelay: '0.1s' }}>✨</span>
                  </div>

                  {/* Dancing avatar with trophy */}
                  <div className="relative inline-block">
                    <span className="text-6xl inline-block animate-dance">{userAvatar}</span>
                    <span className="text-4xl ml-2">🏆</span>
                  </div>

                  <p className="text-2xl font-bold text-green-700 mb-2 mt-3">{currentLanguage === 'tamil' ? 'வெற்றி!' : 'You Win!'}</p>
                  <p className="text-green-600 text-sm">+15 {currentLanguage === 'tamil' ? 'புள்ளிகள்' : 'points'}</p>
                  <button onClick={initializeRaceGame} className="mt-3 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-medium hover:shadow-lg transition-all text-sm relative z-10">
                    {currentLanguage === 'tamil' ? '🔄 மீண்டும் போட்டி' : '🔄 Race Again'}
                  </button>
                </div>
              )}

              {/* Lose Result */}
              {raceResult === 'lose' && (
                <div className="text-center py-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
                  <div className="text-5xl mb-2">🤖🏆</div>
                  <p className="text-2xl font-bold text-red-700 mb-2">{currentLanguage === 'tamil' ? 'ரோபோ வென்றது!' : 'Robot Wins!'}</p>
                  <p className="text-red-600 text-sm">{currentLanguage === 'tamil' ? 'மீண்டும் முயற்சி செய்யவும்!' : 'Try again!'}</p>
                  <button onClick={initializeRaceGame} className="mt-3 px-5 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg transition-all text-sm">
                    {currentLanguage === 'tamil' ? '🔄 மீண்டும் முயற்சி' : '🔄 Try Again'}
                  </button>
                </div>
              )}
            </div>

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAvatarModal(false)}>
                <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-center text-emerald-700 mb-4">
                    {currentLanguage === 'tamil' ? '🎭 உங்கள் அவதாரத்தைத் தேர்வுசெய்க' : '🎭 Choose Your Avatar'}
                  </h3>
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => {
                          setUserAvatar(avatar);
                          localStorage.setItem('thirukural-race-avatar', avatar);
                          setShowAvatarModal(false);
                        }}
                        className={`text-3xl p-2 rounded-xl transition-all hover:scale-110 ${userAvatar === avatar
                          ? 'bg-emerald-100 border-2 border-emerald-500 shadow-lg'
                          : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAvatarModal(false)}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-all"
                  >
                    {currentLanguage === 'tamil' ? 'மூடு' : 'Close'}
                  </button>
                </div>
              </div>
            )}

            {/* Meaning when solved */}
            {isSolved && (
              <div className="px-6 py-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-800 mb-2">
                  {currentLanguage === 'tamil' ? '📜 பொருள்:' : '📜 Meaning:'}
                </h3>
                <p className="text-emerald-700">
                  {currentLanguage === 'tamil' ? currentKural.meaning_tamil : currentKural.meaning_english}
                </p>
              </div>
            )}
          </div>
        )}

        {!isEmbed && (
          <nav className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={previousKural}
              disabled={currentKuralIndex === 0}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
            >
              <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="font-semibold">{currentLanguage === 'tamil' ? 'முந்தைய' : 'Prev'}</span>
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2.5 bg-white border-2 border-purple-200 rounded-full hover:bg-purple-50 hover:border-purple-400 transition-all shadow-md hover:shadow-lg"
                title={currentLanguage === 'tamil' ? 'முகப்பு' : 'Home'}
              >
                <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </Link>

              <div className="bg-gradient-to-r from-purple-100 to-violet-100 px-4 py-1.5 rounded-full border border-purple-200">
                <span className="text-sm font-bold text-purple-700">
                  {currentKuralIndex + 1} / {initialKurals.length}
                </span>
              </div>

              <button
                onClick={resetAllProgress}
                className="p-2.5 bg-white border-2 border-orange-200 rounded-full hover:bg-orange-50 hover:border-orange-400 text-orange-500 transition-all shadow-md hover:shadow-lg"
                title={currentLanguage === 'tamil' ? 'அனைத்தையும் மீட்டமை' : 'Reset all progress'}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>
            </div>

            <button
              onClick={nextKural}
              disabled={currentKuralIndex >= initialKurals.length - 1}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
            >
              <span className="font-semibold">{currentLanguage === 'tamil' ? 'அடுத்த' : 'Next'}</span>
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </nav>
        )}
      </main>

      {/* New Gen Z Badge Modal */}
      <BadgeModal
        isOpen={showBadgeModal}
        onClose={closeBadgeModal}
        language={currentLanguage}
        celebrationType={celebrationType}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isTamil={currentLanguage === 'tamil'}
      />

      {showBadgeModal && (
        <BadgeModal
          isOpen={showBadgeModal}
          onClose={() => setShowBadgeModal(false)}
          celebrationType={celebrationType}
          language={currentLanguage === 'tamil' ? 'tamil' : 'english'}
        />
      )}

      {showNavModal && (
        <NavigationModal
          isOpen={showNavModal}
          onClose={() => setShowNavModal(false)}
          allKuralSlugs={initialKurals.map(k => ({
            id: k.id,
            slug: k.slug || `kural-${k.id}`,
            kural_tamil: k.kural_tamil,
            kural_english: k.kural_english,
            audio_tamil_url: k.audio_tamil_url || undefined,
            audio_english_url: k.audio_english_url || undefined,
            section_tamil: k.section_tamil || undefined,
            section_english: k.section_english || undefined,
            subsection_tamil: k.subsection_tamil || undefined,
            subsection_english: k.subsection_english || undefined
          }))}
          currentKuralId={currentKural?.id}
          language={currentLanguage}
          visitedKurals={visitedKurals}
          bookmarks={bookmarks}
          onToggleBookmark={toggleFavorite}
          totalKurals={initialKurals.length}
        />
      )}

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        isTamil={currentLanguage === 'tamil'}
      />

      {/* New Badge Earned Toast */}
      {newlyEarnedBadge && !showBadgeModal && (
        <BadgeEarnedToast
          badge={newlyEarnedBadge}
          isTamil={currentLanguage === 'tamil'}
          onDismiss={() => setNewlyEarnedBadge(null)}
          onViewAchievements={openBadgeModal}
        />
      )}

      {/* Floating Avatar */}
      {user && !isEmbed && <ReactingAvatar emotion={avatarEmotion} />}
    </div>
  );
}
