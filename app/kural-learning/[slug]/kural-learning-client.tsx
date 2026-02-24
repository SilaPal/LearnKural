'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Kural } from '@/shared/schema';
import BadgeModal from '@/components/badge-modal';
import { NavigationModal, KuralSlugMap as NavKuralSlugMap } from '@/components/navigation-modal';
import { 
  updateKuralActivity, 
  updateStreak, 
  getSkillStats, 
  saveSkillStats,
  checkSkillBadge,
  checkMasteryBadge,
  getMasteredCount,
  saveBadge,
  getAllBadges,
  getUnviewedBadgeCount,
  Badge
} from '@/lib/badge-system';

declare global {
  interface Window {
    pronunciationResult?: { transcript: string; score: number } | null;
  }
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;
  for (let i = 0; i <= len2; i++) matrix[i] = [i];
  for (let j = 0; j <= len1; j++) matrix[0][j] = j;
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[len2][len1];
}

const getTextColorForBackground = (hexColor: string): string => {
  const lightColors = ['#FFEAA7', '#F7DC6F', '#96CEB4', '#98D8C8'];
  return lightColors.includes(hexColor.toUpperCase()) ? '#333333' : '#FFFFFF';
};

function scorePronunciation(spokenText: string, expectedText: string): number {
  const normalize = (text: string) => text.toLowerCase().replace(/[^\u0B80-\u0BFF\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const spoken = normalize(spokenText);
  const expected = normalize(expectedText);
  if (!spoken || !expected) return 0;
  const distance = levenshteinDistance(spoken, expected);
  const maxLength = Math.max(spoken.length, expected.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

type CelebrationType = 'confetti' | 'fireworks' | 'stars' | 'balloons' | 'sparkles' | 'snow' | 'golden' | null;

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
  kuralIndex: number;
  totalKurals: number;
  prevKuralSlug: string | null;
  nextKuralSlug: string | null;
  allKuralSlugs: KuralSlugMap[];
}

export default function KuralLearningClient({ 
  kural, 
  kuralIndex, 
  totalKurals,
  prevKuralSlug,
  nextKuralSlug,
  allKuralSlugs = []
}: Props) {
  const [currentLanguage, setCurrentLanguage] = useState<'tamil' | 'english'>('english');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [visitedKurals, setVisitedKurals] = useState<number[]>([]);
  const [jumpToKural, setJumpToKural] = useState('');
  const [showNavModal, setShowNavModal] = useState(false);
  const hasVideo = kural.youtube_tamil_url || kural.youtube_english_url;
  const [contentMode, setContentMode] = useState<'video' | 'games'>(hasVideo ? 'video' : 'games');
  const [selectedGame, setSelectedGame] = useState<'puzzle' | 'flying' | 'balloon' | 'race'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('thirukural-selected-game');
      if (saved === 'puzzle' || saved === 'flying' || saved === 'balloon' || saved === 'race') return saved;
    }
    return 'puzzle';
  });
  
  const [shuffledPieces, setShuffledPieces] = useState<PuzzlePiece[]>([]);
  const [placedPieces, setPlacedPieces] = useState<(PuzzlePiece | null)[]>([]);
  const [gameSolved, setGameSolved] = useState(false);
  const [puzzleTimer, setPuzzleTimer] = useState(0);
  const [puzzleTimerActive, setPuzzleTimerActive] = useState(false);
  const [puzzleStreak, setPuzzleStreak] = useState(0);
  const [puzzleBonusPoints, setPuzzleBonusPoints] = useState(0);
  const [lastPlacedCorrect, setLastPlacedCorrect] = useState<number | null>(null);
  const [shakeWrongSlot, setShakeWrongSlot] = useState<number | null>(null);
  
  const [flyingWords, setFlyingWords] = useState<FlyingWord[]>([]);
  const [nextExpectedPosition, setNextExpectedPosition] = useState(0);
  const [flyingSpeed, setFlyingSpeed] = useState<'slow' | 'medium' | 'fast'>('slow');
  
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
  
  const [videoWatched, setVideoWatched] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationFeedback, setPronunciationFeedback] = useState<'none' | 'recording' | 'success' | 'failed'>('none');
  const [pronunciationPracticed, setPronunciationPracticed] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [newBadgeCount, setNewBadgeCount] = useState(0);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [celebrationType, setCelebrationType] = useState<CelebrationType>(null);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<Badge | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil' || savedLang === 'english') {
      setCurrentLanguage(savedLang);
    } else {
      const browserLang = navigator.language || '';
      if (browserLang.toLowerCase().startsWith('ta')) {
        setCurrentLanguage('tamil');
      }
    }
    
    const savedAvatar = localStorage.getItem('thirukural-race-avatar');
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    }

    setNewBadgeCount(getUnviewedBadgeCount());
    
    const { newBadge } = updateStreak();
    if (newBadge) {
      saveBadge(newBadge);
      setNewlyEarnedBadge(newBadge);
      setNewBadgeCount(prev => prev + 1);
    }

    const savedBookmarks = localStorage.getItem('thirukural-bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    const savedVisited = localStorage.getItem('thirukural-visited');
    const visited = savedVisited ? JSON.parse(savedVisited) : [];
    if (!visited.includes(kural.id)) {
      visited.push(kural.id);
      localStorage.setItem('thirukural-visited', JSON.stringify(visited));
    }
    setVisitedKurals(visited);

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipod|android.*mobile/.test(userAgent) || window.innerWidth <= 768;
    const isTablet = /ipad/.test(userAgent) || (/android/.test(userAgent) && !/mobile/.test(userAgent));
    setIsDesktop(!isMobile && !isTablet);
    
    const hasSpeechRecognition = ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    setSpeechSupported(hasSpeechRecognition);
  }, [kural.id]);

  const toggleBookmark = (kuralId?: number) => {
    const id = kuralId ?? kural.id;
    const newBookmarks = bookmarks.includes(id)
      ? bookmarks.filter(b => b !== id)
      : [...bookmarks, id];
    setBookmarks(newBookmarks);
    localStorage.setItem('thirukural-bookmarks', JSON.stringify(newBookmarks));
  };

  const handleJumpToKural = () => {
    const kuralNum = parseInt(jumpToKural);
    if (kuralNum >= 1 && kuralNum <= totalKurals && allKuralSlugs) {
      const targetSlug = allKuralSlugs.find(k => k.id === kuralNum);
      if (targetSlug) {
        router.push(`/kural-learning/${targetSlug.slug}`);
      }
    }
    setJumpToKural('');
  };

  const initializePuzzle = useCallback(() => {
    const kuralText = kural.kural_tamil;
    const words = kuralText.replace(/\\n/g, ' ').replace(/\n/g, ' ').split(/\s+/).filter(word => word.trim().length > 0);
    const pieces: PuzzlePiece[] = words.map((word, index) => ({ id: `piece-${index}`, word: word.trim(), correctPosition: index }));
    const shuffled = [...pieces].sort(() => Math.random() - 0.5);
    setShuffledPieces(shuffled);
    setPlacedPieces(new Array(pieces.length).fill(null));
    setGameSolved(false);
    setPuzzleTimer(60);
    setPuzzleTimerActive(true);
    setPuzzleStreak(0);
    setPuzzleBonusPoints(0);
    setLastPlacedCorrect(null);
    setShakeWrongSlot(null);
  }, [kural.kural_tamil]);

  const initializeFlyingGame = useCallback(() => {
    const kuralText = kural.kural_tamil;
    const words = kuralText.replace(/\\n/g, ' ').replace(/\n/g, ' ').split(/\s+/).filter(word => word.trim().length > 0);
    const flyingWordsInit: FlyingWord[] = words.map((word, index) => ({
      id: `flying-${index}`, word: word.trim(), correctPosition: index,
      x: Math.random() * 70 + 10, y: Math.random() * 60 + 15,
      dx: (Math.random() - 0.5) * 2, dy: (Math.random() - 0.5) * 2, isClicked: false
    }));
    setFlyingWords(flyingWordsInit);
    setNextExpectedPosition(0);
    setGameSolved(false);
  }, [kural.kural_tamil]);

  const initializeBalloonGame = useCallback(() => {
    const kuralText = kural.kural_tamil;
    const words = kuralText.replace(/\\n/g, ' ').replace(/\n/g, ' ').split(/\s+/).filter(word => word.trim().length > 0);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const balloonWordsInit: BalloonWord[] = words.map((word, index) => ({
      id: `balloon-${index}`, word: word.trim(), correctPosition: index, isPopped: false,
      x: 10 + Math.random() * 80, y: 20 + Math.random() * 50, color: colors[index % colors.length], bobOffset: Math.random() * Math.PI * 2
    }));
    setBalloonWords(balloonWordsInit);
    setRevealedWords([]);
    setArrangedWords(Array(words.length).fill(null));
    setBalloonPhase('popping');
    setGameSolved(false);
  }, [kural.kural_tamil]);

  const initializeRaceGame = useCallback(() => {
    const kuralText = kural.kural_tamil;
    const words = kuralText.replace(/\\n/g, ' ').replace(/\n/g, ' ').split(/\s+/).filter(word => word.trim().length > 0);
    const shuffledWords = words.map((word, index) => ({
      id: index, word: word.trim(), position: index
    })).sort(() => Math.random() - 0.5);
    setRaceWords(shuffledWords);
    setPlayerProgress(0);
    setAiProgress(0);
    setRaceActive(true);
    setRaceResult('none');
    setGameSolved(false);
    
    // Clear any existing AI interval
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
  }, [kural.kural_tamil]);

  // AI opponent logic for race game
  useEffect(() => {
    if (selectedGame !== 'race' || !raceActive || raceResult !== 'none') return;
    
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
  }, [selectedGame, raceActive, raceResult, raceDifficulty, raceWords.length]);

  const handleRaceWordClick = (word: { id: number; word: string; position: number }) => {
    if (!raceActive || raceResult !== 'none') return;
    
    // Check if this is the correct next word
    if (word.position === playerProgress) {
      const newProgress = playerProgress + 1;
      setPlayerProgress(newProgress);
      setRaceWords(prev => prev.filter(w => w.id !== word.id));
      
      if (newProgress >= raceWords.length + playerProgress) {
        // Player wins!
        setRaceResult('win');
        setRaceActive(false);
        setGameSolved(true);
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('thirukural-selected-game', selectedGame);
  }, [selectedGame]);

  useEffect(() => {
    if (contentMode === 'games') {
      if (selectedGame === 'puzzle') initializePuzzle();
      else if (selectedGame === 'flying') initializeFlyingGame();
      else if (selectedGame === 'balloon') initializeBalloonGame();
      else if (selectedGame === 'race') initializeRaceGame();
    }
  }, [contentMode, selectedGame, initializePuzzle, initializeFlyingGame, initializeBalloonGame, initializeRaceGame]);

  useEffect(() => {
    if (selectedGame !== 'flying' || gameSolved || flyingWords.length === 0) return;
    const speedMultiplier = flyingSpeed === 'slow' ? 0.5 : flyingSpeed === 'fast' ? 1.8 : 1;
    const intervalTime = flyingSpeed === 'slow' ? 60 : flyingSpeed === 'fast' ? 35 : 50;
    const interval = setInterval(() => {
      setFlyingWords(prev => prev.map(word => {
        if (word.isClicked) return word;
        let newX = word.x + word.dx * speedMultiplier, newY = word.y + word.dy * speedMultiplier, newDx = word.dx, newDy = word.dy;
        if (newX <= 5 || newX >= 85) newDx = -newDx;
        if (newY <= 5 || newY >= 75) newDy = -newDy;
        return { ...word, x: newX, y: newY, dx: newDx, dy: newDy };
      }));
    }, intervalTime);
    return () => clearInterval(interval);
  }, [selectedGame, gameSolved, flyingWords.length, flyingSpeed]);

  useEffect(() => {
    if (!puzzleTimerActive || gameSolved || puzzleTimer <= 0) return;
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
  }, [puzzleTimerActive, gameSolved, puzzleTimer]);

  useEffect(() => {
    if (placedPieces.length === 0) return;
    const allPlaced = placedPieces.every(piece => piece !== null);
    if (!allPlaced) return;
    const isCorrect = placedPieces.every((piece, index) => piece !== null && piece.correctPosition === index);
    if (isCorrect && !gameSolved) {
      setGameSolved(true);
      setPuzzleTimerActive(false);
      const timeBonus = puzzleTimer * 2;
      setPuzzleBonusPoints(prev => prev + timeBonus);
    }
  }, [placedPieces, gameSolved, puzzleTimer]);

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
    if (word.isClicked || gameSolved) return;
    if (word.correctPosition === nextExpectedPosition) {
      setFlyingWords(prev => prev.map(w => w.id === word.id ? { ...w, isClicked: true } : w));
      const newPosition = nextExpectedPosition + 1;
      setNextExpectedPosition(newPosition);
      if (newPosition === flyingWords.length) setGameSolved(true);
    }
  };

  const handleBalloonPop = (balloon: BalloonWord) => {
    if (balloon.isPopped || gameSolved) return;
    setBalloonWords(prev => {
      const updated = prev.map(b => b.id === balloon.id ? { ...b, isPopped: true } : b);
      if (updated.every(b => b.isPopped)) setTimeout(() => setBalloonPhase('arranging'), 500);
      return updated;
    });
    setRevealedWords(prev => [...prev, balloon]);
  };

  const handleArrangeWord = (word: BalloonWord, slotIndex: number) => {
    if (gameSolved) return;
    const newArranged = [...arrangedWords];
    const existingIndex = newArranged.findIndex(w => w?.id === word.id);
    if (existingIndex !== -1) newArranged[existingIndex] = null;
    if (newArranged[slotIndex] !== null) setRevealedWords(prev => [...prev, newArranged[slotIndex]!]);
    newArranged[slotIndex] = word;
    setArrangedWords(newArranged);
    setRevealedWords(prev => prev.filter(w => w.id !== word.id));
    if (newArranged.every(w => w !== null)) {
      const isCorrect = newArranged.every((w, i) => w?.correctPosition === i);
      if (isCorrect) setGameSolved(true);
    }
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    if (gameSolved) return;
    const word = arrangedWords[slotIndex];
    if (word) {
      const newArranged = [...arrangedWords];
      newArranged[slotIndex] = null;
      setArrangedWords(newArranged);
      setRevealedWords(prev => [...prev, word]);
    }
  };

  const resetGame = () => {
    if (selectedGame === 'puzzle') initializePuzzle();
    else if (selectedGame === 'flying') initializeFlyingGame();
    else if (selectedGame === 'balloon') initializeBalloonGame();
    else if (selectedGame === 'race') initializeRaceGame();
  };

  
  const openBadgeModal = () => {
    const allBadges = getAllBadges();
    const unviewedBadges = allBadges.filter(b => !b.viewed);
    
    if (unviewedBadges.length > 0) {
      const lastBadge = unviewedBadges[unviewedBadges.length - 1];
      // Tier-based celebration effects
      if (lastBadge.tier === 'diamond') {
        setCelebrationType('golden');
      } else if (lastBadge.tier === 'gold') {
        setCelebrationType('fireworks');
      } else if (lastBadge.tier === 'silver') {
        setCelebrationType('snow');
      } else if (lastBadge.tier === 'bronze') {
        setCelebrationType('sparkles');
      } else if (lastBadge.type === 'mastery') {
        setCelebrationType('confetti');
      } else if (lastBadge.type === 'streak') {
        setCelebrationType('fireworks');
      } else if (lastBadge.type === 'skill') {
        setCelebrationType('stars');
      }
    } else if (allBadges.length > 0) {
      setCelebrationType('sparkles');
    }
    
    setShowBadgeModal(true);
    setNewBadgeCount(0);
  };
  
  const closeBadgeModal = () => {
    setShowBadgeModal(false);
    setCelebrationType(null);
    setNewlyEarnedBadge(null);
  };
  
  const handleActivityComplete = useCallback((activity: 'audio' | 'video' | 'puzzle' | 'flying' | 'balloon' | 'race', timeSeconds?: number) => {
    updateKuralActivity(kural.id, activity);
    
    const stats = getSkillStats();
    
    if (activity === 'puzzle' && timeSeconds !== undefined) {
      if (stats.puzzleFastestTime === null || timeSeconds < stats.puzzleFastestTime) {
        stats.puzzleFastestTime = timeSeconds;
        saveSkillStats(stats);
      }
      
      const speedBadge = checkSkillBadge('speedDemon', stats);
      if (speedBadge) {
        saveBadge(speedBadge);
        setNewlyEarnedBadge(speedBadge);
        setNewBadgeCount(prev => prev + 1);
        setCelebrationType('snow');
      }
    }
    
    if (activity === 'balloon' && stats.balloonPerfectGames >= 0) {
      const balloonBadge = checkSkillBadge('balloonMaster', stats);
      if (balloonBadge) {
        saveBadge(balloonBadge);
        setNewlyEarnedBadge(balloonBadge);
        setNewBadgeCount(prev => prev + 1);
        setCelebrationType('confetti');
      }
    }
    
    if (activity === 'flying' && stats.flyingPerfectGames >= 0) {
      const flyingBadge = checkSkillBadge('flyingAce', stats);
      if (flyingBadge) {
        saveBadge(flyingBadge);
        setNewlyEarnedBadge(flyingBadge);
        setNewBadgeCount(prev => prev + 1);
        setCelebrationType('confetti');
      }
    }
    
    const masteredCount = getMasteredCount();
    const masteryBadge = checkMasteryBadge(masteredCount);
    if (masteryBadge) {
      saveBadge(masteryBadge);
      setNewlyEarnedBadge(masteryBadge);
      setNewBadgeCount(prev => prev + 1);
      setCelebrationType('confetti');
    }
  }, [kural.id]);

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'tamil' ? 'english' : 'tamil';
    setCurrentLanguage(newLang);
    localStorage.setItem('thirukural-language', newLang);
  };

  const startSpeechRecognition = useCallback(() => {
    if (!speechSupported) return;
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ta-IN';
      
      const timeout = setTimeout(() => {
        if (recognitionRef.current === recognition) {
          recognition.stop();
        }
      }, 10000);

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          const score = scorePronunciation(transcript, kural.kural_tamil);
          if (!window.pronunciationResult || score > window.pronunciationResult.score) {
            window.pronunciationResult = { transcript, score };
          }
        }
      };

      recognition.onerror = () => {
        clearTimeout(timeout);
        setIsRecording(false);
        setPronunciationFeedback('failed');
        setTimeout(() => setPronunciationFeedback('none'), 2000);
      };

      recognition.onend = () => {
        setIsRecording(false);
        clearTimeout(timeout);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setPronunciationFeedback('recording');
      window.pronunciationResult = null;
    } catch (error) {
      console.error('Speech recognition error:', error);
    }
  }, [speechSupported, kural.kural_tamil]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (!pronunciationPracticed) {
      setPronunciationPracticed(true);
    }
    
    setTimeout(() => {
      const result = window.pronunciationResult;
      if (result && result.score > 0.25) {
        setPronunciationFeedback('success');
        setTimeout(() => setPronunciationFeedback('none'), 3000);
        
        // Track perfect pronunciation for skill badge
        if (result.score >= 0.8) {
          const stats = getSkillStats();
          stats.perfectPronunciations = (stats.perfectPronunciations || 0) + 1;
          saveSkillStats(stats);
          
          const sharpBadge = checkSkillBadge('sharpEars', stats);
          if (sharpBadge) {
            saveBadge(sharpBadge);
            setNewlyEarnedBadge(sharpBadge);
            setNewBadgeCount(prev => prev + 1);
          }
        }
      } else {
        setPronunciationFeedback('failed');
        setTimeout(() => setPronunciationFeedback('none'), 2000);
      }
      window.pronunciationResult = null;
    }, 500);
  }, [pronunciationPracticed]);

  const handlePronunciationToggle = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const handleFallbackPronunciation = () => {
    if (!pronunciationPracticed) {
      setPronunciationPracticed(true);
    }
    setPronunciationFeedback('success');
    setTimeout(() => setPronunciationFeedback('none'), 3000);
    
    // Track as perfect pronunciation for skill badge
    const stats = getSkillStats();
    stats.perfectPronunciations = (stats.perfectPronunciations || 0) + 1;
    saveSkillStats(stats);
    
    const sharpBadge = checkSkillBadge('sharpEars', stats);
    if (sharpBadge) {
      saveBadge(sharpBadge);
      setNewlyEarnedBadge(sharpBadge);
      setNewBadgeCount(prev => prev + 1);
    }
  };

  const playAudio = () => {
    const audioUrl = currentLanguage === 'tamil' ? kural.audio_tamil_url : kural.audio_english_url;
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onended = () => {
      setIsPlaying(false);
      if (!audioPlayed) {
        setAudioPlayed(true);
        handleActivityComplete('audio');
      }
    };

    audio.play().catch(console.error);
    setIsPlaying(true);
  };

  const handleVideoComplete = () => {
    if (!videoWatched) {
      setVideoWatched(true);
      handleActivityComplete('video');
    }
  };

  const audioUrl = currentLanguage === 'tamil' ? kural.audio_tamil_url : kural.audio_english_url;
  const videoUrl = currentLanguage === 'tamil' ? kural.youtube_tamil_url : kural.youtube_english_url;

  return (
    <article className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Link href="/">
              <img src="/logo.png" alt="Tamili Logo" className="h-12 w-12 rounded-full" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">
              {currentLanguage === 'tamil' ? `திருக்குறள் ${kural.id}` : `Thirukkural ${kural.id}`}
            </h1>
          </div>
          <p className="text-gray-600 text-sm text-center">
            {currentLanguage === 'tamil' 
              ? 'ஒலி மற்றும் காணொளியுடன் தமிழ் ஞானத்தைக் கற்றுக்கொள்ளுங்கள்'
              : 'Interactive Tamil wisdom learning with audio and video'
            }
          </p>
        </header>
        
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={openBadgeModal}
              className="relative px-2 py-1 border-2 border-yellow-500 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-105 transition-transform flex items-center"
              aria-label={currentLanguage === 'tamil' ? 'பேட்ஜ்கள்' : 'Badges'}
              title={currentLanguage === 'tamil' ? 'உன் பேட்ஜ்களைப் பார்' : 'View your badges'}
            >
              <span className="text-lg">🏅</span>
              {newBadgeCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {newBadgeCount}
                </span>
              )}
            </button>
            <button
              onClick={() => toggleBookmark()}
              className={`px-2 py-1 border-2 rounded-lg transition flex items-center ${
                bookmarks.includes(kural.id) 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-300 bg-white hover:border-red-300'
              }`}
              aria-label={currentLanguage === 'tamil' ? 'புத்தகக்குறி' : 'Bookmark'}
              title={currentLanguage === 'tamil' ? 'இந்தக் குறளை சேமி' : 'Save this kural'}
            >
              <span className="text-lg">{bookmarks.includes(kural.id) ? '❤️' : '🤍'}</span>
            </button>
            <button
              onClick={() => setShowNavModal(true)}
              className="px-2 py-1 border-2 border-orange-500 rounded-lg bg-white hover:bg-orange-50 transition flex items-center"
              aria-label={currentLanguage === 'tamil' ? 'வழிசெலுத்தல்' : 'Navigate'}
              title={currentLanguage === 'tamil' ? 'உன் முன்னேற்றத்தைப் பார்' : 'View your progress'}
            >
              <span className="text-lg">🔥</span>
            </button>
          </div>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            {currentLanguage === 'tamil' ? 'English' : 'தமிழ்'}
          </button>
        </div>
        
        <section className="mb-6 rounded-2xl shadow-lg overflow-hidden">
          <h2 className="sr-only">Kural Text</h2>
          <div className="bg-purple-50 p-6">
            <div className="font-tamil text-xl font-bold text-gray-900 whitespace-pre-line leading-relaxed text-center tracking-tight">
              {kural.kural_tamil.replace(/\\n/g, '\n')}
            </div>
          </div>
          <div className="bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {currentLanguage === 'tamil' ? 'பொருள்' : 'Meaning'}
            </h3>
            <p className="text-gray-700">
              {currentLanguage === 'tamil' ? kural.meaning_tamil : kural.meaning_english}
            </p>
          </div>
        </section>
        
        
        <div className="space-y-6">
          {(audioUrl || isDesktop) && (
            <div className={`grid gap-4 ${audioUrl && isDesktop ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {audioUrl && (
                <section className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {currentLanguage === 'tamil' ? 'கேட்டுக் கற்க' : 'Listen & Learn'}
                  </h3>
                  <div className="text-center">
                    <button
                      onClick={playAudio}
                      disabled={isPlaying}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 transform hover:scale-105 mx-auto mb-4 ${
                        isPlaying 
                          ? 'bg-purple-400 cursor-not-allowed' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        {isPlaying ? (
                          <>
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </>
                        ) : (
                          <polygon points="5,3 19,12 5,21" />
                        )}
                      </svg>
                    </button>
                    <p className="text-gray-600 text-sm mb-2">
                      {isPlaying 
                        ? (currentLanguage === 'tamil' ? 'இயங்குகிறது...' : 'Playing...') 
                        : (currentLanguage === 'tamil' ? 'ஒலியை கேள்' : 'Click to play audio')
                      }
                    </p>
                  </div>
                </section>
              )}

              {isDesktop && (
                <section className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {currentLanguage === 'tamil' ? 'உச்சரிப்பு பயிற்சி' : 'Practice Pronunciation'}
                  </h3>
                  <div className="text-center">
                    {speechSupported ? (
                      <button
                        onClick={handlePronunciationToggle}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 transform hover:scale-105 mx-auto mb-4 ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        title={isRecording ? 'Click to stop recording' : 'Click to start recording'}
                      >
                        {isRecording ? (
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="22"/>
                            <line x1="8" y1="22" x2="16" y2="22"/>
                          </svg>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleFallbackPronunciation}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-green-500 hover:bg-green-600 transition-all duration-200 transform hover:scale-105 mx-auto mb-4"
                        title="Practice pronunciation (tap after you try)"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </button>
                    )}
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {speechSupported 
                        ? (currentLanguage === 'tamil' 
                          ? (isRecording ? 'நிறுத்த அழுத்தவும்' : 'பதிவைத் தொடங்க')
                          : (isRecording ? 'Click to stop' : 'Click to record'))
                        : (currentLanguage === 'tamil' 
                          ? 'உச்சரித்து அழுத்தவும்' 
                          : 'Practice & tap')
                      }
                    </p>
                    
                    {pronunciationFeedback === 'success' && (
                      <div className="animate-pulse">
                        <div className="text-3xl mb-1">😊</div>
                        <p className="text-green-600 font-semibold text-sm">
                          {currentLanguage === 'tamil' ? 'அருமை!' : 'Great!'}
                        </p>
                      </div>
                    )}
                    
                    {pronunciationFeedback === 'failed' && (
                      <div>
                        <div className="text-3xl mb-1">😞</div>
                        <p className="text-orange-600 font-semibold text-sm">
                          {currentLanguage === 'tamil' ? 'மீண்டும் முயற்சிக்கவும்!' : 'Try again!'}
                        </p>
                      </div>
                    )}
                    
                  </div>
                </section>
              )}
            </div>
          )}

          <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex justify-center py-3">
              <div className="relative inline-flex bg-gray-100 rounded-full p-1">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out ${
                    contentMode === 'video' 
                      ? 'left-1 bg-purple-600' 
                      : 'left-[calc(50%+2px)] bg-green-600'
                  }`}
                />
                <button
                  onClick={() => setContentMode('video')}
                  className={`relative z-10 py-1.5 px-4 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                    contentMode === 'video' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  ▶️ {currentLanguage === 'tamil' ? 'காணொளி' : 'Video'}
                </button>
                <button
                  onClick={() => setContentMode('games')}
                  className={`relative z-10 py-1.5 px-4 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                    contentMode === 'games' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  🎮 {currentLanguage === 'tamil' ? 'விளையாட்டு' : 'Games'}
                </button>
              </div>
            </div>

            {contentMode === 'video' && (
              <div className="p-6">
                {videoUrl ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={videoUrl}
                      title={`Thirukkural ${kural.id} - ${currentLanguage === 'tamil' ? 'குறள் விளக்க வீடியோ' : 'Kural explanation video'}`}
                      aria-label={`${currentLanguage === 'tamil' ? 'திருக்குறள்' : 'Thirukkural'} ${kural.id} ${currentLanguage === 'tamil' ? 'வீடியோ பாடம்' : 'video lesson'}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => setTimeout(handleVideoComplete, 30000)}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl mb-4 block">📺</span>
                    <p>{currentLanguage === 'tamil' ? 'இந்தக் குறளுக்கு வீடியோ இல்லை' : 'No video available for this kural'}</p>
                  </div>
                )}
              </div>
            )}

            {contentMode === 'games' && (
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <button
                    onClick={() => setSelectedGame('puzzle')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition ${
                      selectedGame === 'puzzle' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🧩 {currentLanguage === 'tamil' ? 'புதிர்' : 'Puzzle'}
                  </button>
                  <button
                    onClick={() => setSelectedGame('flying')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition ${
                      selectedGame === 'flying' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🦋 {currentLanguage === 'tamil' ? 'பறக்கும்' : 'Flying'}
                  </button>
                  <button
                    onClick={() => setSelectedGame('balloon')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition ${
                      selectedGame === 'balloon' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🎈 {currentLanguage === 'tamil' ? 'பலூன்' : 'Balloon'}
                  </button>
                  <button
                    onClick={() => setSelectedGame('race')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition ${
                      selectedGame === 'race' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🏁 {currentLanguage === 'tamil' ? 'போட்டி' : 'Race'}
                  </button>
                </div>

                {selectedGame === 'puzzle' && (
                  <div>
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-blue-800 text-sm">
                          {currentLanguage === 'tamil' 
                            ? '📝 சொற்களை சரியான வரிசையில் அமைக்கவும்'
                            : '📝 Arrange words in correct order'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                          puzzleTimer <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-blue-600'
                        }`}>
                          ⏱️ {puzzleTimer}s
                        </div>
                        {puzzleStreak > 0 && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-white text-sm font-bold animate-bounce">
                            🔥 x{puzzleStreak} {currentLanguage === 'tamil' ? 'தொடர்!' : 'Streak!'}
                          </div>
                        )}
                        {puzzleBonusPoints > 0 && (
                          <div className="text-green-600 font-bold text-sm">+{puzzleBonusPoints} pts</div>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        {currentLanguage === 'tamil' ? 'குறள் உருவாக்குங்கள்:' : 'Build the Kural:'}
                      </h4>
                      <div className="flex flex-wrap gap-2 min-h-[80px] p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 relative">
                        {placedPieces.map((piece, index) => (
                          <button
                            key={`slot-${index}`}
                            className={`min-w-[50px] min-h-[40px] flex items-center justify-center rounded-lg border-2 transition-all cursor-pointer text-sm relative
                              ${piece 
                                ? gameSolved 
                                  ? 'bg-green-100 border-green-400 text-green-800' 
                                  : lastPlacedCorrect === index
                                    ? 'bg-green-200 border-green-500 text-green-800 scale-110'
                                    : 'bg-yellow-100 border-yellow-400 text-yellow-800'
                                : 'bg-white border-gray-300 border-dashed'
                              }
                              ${shakeWrongSlot === index ? 'animate-shake' : ''}
                            `}
                            onClick={() => handleSlotClick(index)}
                            style={shakeWrongSlot === index ? { animation: 'shake 0.5s ease-in-out' } : {}}
                          >
                            {piece ? (
                              <span className="px-2 py-1 font-tamil font-medium">{piece.word}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">{index + 1}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        {currentLanguage === 'tamil' ? 'சொற்கள்:' : 'Words:'}
                      </h4>
                      <div className="flex flex-wrap gap-2 min-h-[50px]">
                        {shuffledPieces.map((piece) => (
                          <button
                            key={piece.id}
                            onClick={() => handlePieceClick(piece)}
                            className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white px-3 py-1.5 rounded-lg font-tamil text-sm font-medium cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105 animate-wiggle"
                          >
                            {piece.word}
                          </button>
                        ))}
                      </div>
                    </div>
                    {gameSolved && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 text-center">
                        <span className="text-4xl">🎉</span>
                        <p className="text-green-700 font-bold text-lg mt-2">{currentLanguage === 'tamil' ? 'சரியாக செய்தீர்கள்!' : 'Well done!'}</p>
                        {puzzleBonusPoints > 0 && (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <span className="text-2xl">⭐</span>
                            <span className="text-green-600 font-bold text-xl">+{puzzleBonusPoints} {currentLanguage === 'tamil' ? 'புள்ளிகள்' : 'points'}</span>
                          </div>
                        )}
                        {puzzleTimer > 0 && (
                          <p className="text-green-600 text-sm mt-1">
                            ⏱️ {currentLanguage === 'tamil' ? `${puzzleTimer} நொடிகள் மீதம்!` : `${puzzleTimer}s remaining!`}
                          </p>
                        )}
                        <button onClick={resetGame} className="mt-3 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all">
                          {currentLanguage === 'tamil' ? '🔄 மீண்டும் விளையாடு' : '🔄 Play Again'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedGame === 'flying' && (
                  <div>
                    <div className="bg-purple-50 p-3 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-purple-800 text-sm">
                          {currentLanguage === 'tamil' 
                            ? '🎯 பறக்கும் சொற்களை சரியான வரிசையில் கிளிக் செய்யுங்கள்!'
                            : '🎯 Click the flying words in the correct order!'}
                        </p>
                        <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
                          <button
                            onClick={() => setFlyingSpeed('slow')}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                              flyingSpeed === 'slow' 
                                ? 'bg-green-500 text-white' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                            title={currentLanguage === 'tamil' ? 'மெதுவாக' : 'Slow'}
                          >
                            🐢
                          </button>
                          <button
                            onClick={() => setFlyingSpeed('medium')}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                              flyingSpeed === 'medium' 
                                ? 'bg-yellow-500 text-white' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                            title={currentLanguage === 'tamil' ? 'நடுத்தரம்' : 'Medium'}
                          >
                            🐇
                          </button>
                          <button
                            onClick={() => setFlyingSpeed('fast')}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                              flyingSpeed === 'fast' 
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
                    <div className="relative h-[360px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl overflow-hidden">
                      {flyingWords.map((word) => (
                        <button
                          key={word.id}
                          onClick={() => handleFlyingWordClick(word)}
                          className={`absolute px-3 py-1.5 rounded-lg font-tamil text-sm font-medium cursor-pointer shadow-md transition-all duration-200
                            ${word.isClicked 
                              ? 'bg-green-400 text-white opacity-50 cursor-default scale-90' 
                              : 'bg-purple-500 text-white flying-word-glow hover:scale-105 hover:bg-purple-600'
                            }`}
                          style={{ left: `${word.x}%`, top: `${word.y}%` }}
                          disabled={word.isClicked}
                        >
                          {word.word}
                        </button>
                      ))}
                      {gameSolved && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-100/80">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🎉</div>
                            <p className="text-xl font-bold text-green-700">{currentLanguage === 'tamil' ? 'சரி!' : 'Completed!'}</p>
                            <button onClick={resetGame} className="mt-2 px-4 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                              {currentLanguage === 'tamil' ? 'மீண்டும் விளையாடு' : 'Play Again'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedGame === 'balloon' && (
                  <div>
                    <div className="bg-pink-50 p-3 rounded-lg mb-4">
                      <p className="text-pink-800 text-sm">
                        {balloonPhase === 'popping'
                          ? (currentLanguage === 'tamil' ? '🎈 பலூன்களை உடைத்து சொற்களைக் கண்டறியுங்கள்!' : '🎈 Pop the balloons to reveal the words!')
                          : (currentLanguage === 'tamil' ? '📝 சொற்களை சரியான வரிசையில் அமைக்கவும்' : '📝 Arrange the words in the correct order')}
                      </p>
                    </div>
                    {balloonPhase === 'popping' && (
                      <div>
                        <div className="relative h-[300px] bg-gradient-to-b from-sky-200 via-blue-100 to-pink-50 rounded-xl overflow-hidden mb-4">
                          {/* Floating sparkles background */}
                          <div className="absolute top-4 left-8 text-lg opacity-60" style={{ animation: 'sparkle 2s ease-in-out infinite' }}>✨</div>
                          <div className="absolute top-12 right-12 text-sm opacity-50" style={{ animation: 'sparkle 2s ease-in-out infinite 0.5s' }}>⭐</div>
                          <div className="absolute bottom-8 left-1/4 text-lg opacity-40" style={{ animation: 'sparkle 2s ease-in-out infinite 1s' }}>✨</div>
                          
                          {balloonWords.map((balloon) => !balloon.isPopped && (
                            <button
                              key={balloon.id}
                              onClick={() => handleBalloonPop(balloon)}
                              className="absolute cursor-pointer transition-all duration-300 balloon-hover active:scale-90 sparkle-effect"
                              style={{ 
                                left: `${balloon.x}%`, 
                                top: `${balloon.y}%`, 
                                transform: 'translate(-50%, -50%)',
                                animation: `bounce 2s ease-in-out infinite`,
                                animationDelay: `${balloon.bobOffset * 200}ms`,
                              }}
                            >
                              <div className="relative pointer-events-none">
                                <div 
                                  className="w-14 h-16 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden"
                                  style={{ 
                                    background: `radial-gradient(circle at 30% 30%, ${balloon.color}ff, ${balloon.color}dd, ${balloon.color}aa)`,
                                    boxShadow: `0 4px 20px ${balloon.color}88, 0 0 30px ${balloon.color}44`
                                  }}
                                >
                                  <span className="text-white font-bold text-2xl drop-shadow-lg">?</span>
                                  <div className="absolute top-2 left-2 w-3 h-5 bg-white/40 rounded-full transform rotate-45" />
                                  {/* Shimmer overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }} />
                                </div>
                                <div 
                                  className="w-3 h-2 mx-auto -mt-0.5"
                                  style={{ 
                                    background: balloon.color,
                                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                                  }}
                                />
                                <div className="w-0.5 h-8 mx-auto" style={{ 
                                  background: 'linear-gradient(to bottom, #9ca3af, transparent)'
                                }} />
                              </div>
                            </button>
                          ))}
                        </div>
                        {revealedWords.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                            <p className="text-green-700 text-xs mb-2 font-medium">
                              {currentLanguage === 'tamil' ? '🎉 கண்டுபிடித்த சொற்கள்:' : '🎉 Words revealed:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {revealedWords.map((word) => (
                                <span
                                  key={word.id}
                                  className="px-3 py-1.5 rounded-lg font-tamil text-sm font-medium shadow-md animate-pulse"
                                  style={{ backgroundColor: word.color, color: getTextColorForBackground(word.color) }}
                                >
                                  {word.word}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {balloonPhase === 'arranging' && (
                      <div>
                        <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 mb-4">
                          {arrangedWords.map((word, index) => (
                            <button
                              key={`arrange-slot-${index}`}
                              className={`min-w-[50px] min-h-[40px] flex items-center justify-center rounded-lg border-2 transition-all cursor-pointer text-sm
                                ${word 
                                  ? gameSolved ? 'bg-green-100 border-green-400 text-green-800' : 'bg-pink-100 border-pink-400 text-pink-800'
                                  : 'bg-white border-gray-300 border-dashed'
                                }`}
                              onClick={() => handleRemoveFromSlot(index)}
                            >
                              {word ? <span className="px-2 py-1 font-tamil font-medium">{word.word}</span> : <span className="text-gray-400 text-xs">{index + 1}</span>}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {revealedWords.map((word) => (
                            <button
                              key={word.id}
                              onClick={() => {
                                const emptySlot = arrangedWords.findIndex(w => w === null);
                                if (emptySlot !== -1) handleArrangeWord(word, emptySlot);
                              }}
                              className="px-3 py-1.5 rounded-lg font-tamil text-sm font-medium cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105"
                              style={{ backgroundColor: word.color, color: getTextColorForBackground(word.color) }}
                            >
                              {word.word}
                            </button>
                          ))}
                        </div>
                        {gameSolved && (
                          <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                            <span className="text-3xl">🎉</span>
                            <p className="text-green-700 font-semibold mt-2">{currentLanguage === 'tamil' ? 'சரியாக செய்தீர்கள்!' : 'Well done!'}</p>
                            <button onClick={resetGame} className="mt-2 px-4 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                              {currentLanguage === 'tamil' ? 'மீண்டும் விளையாடு' : 'Play Again'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedGame === 'race' && (
                  <div>
                    <div className="bg-green-50 p-3 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-green-800 text-sm">
                          {currentLanguage === 'tamil' 
                            ? '🏁 ரோபோவை வெல்லுங்கள்! சொற்களை வரிசையாகத் தேர்ந்தெடுக்கவும்'
                            : '🏁 Beat the Robot! Select words in order'}
                        </p>
                        <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
                          <button
                            onClick={() => { setRaceDifficulty('easy'); initializeRaceGame(); }}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                              raceDifficulty === 'easy' ? 'bg-green-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            😊
                          </button>
                          <button
                            onClick={() => { setRaceDifficulty('medium'); initializeRaceGame(); }}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                              raceDifficulty === 'medium' ? 'bg-yellow-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            😎
                          </button>
                          <button
                            onClick={() => { setRaceDifficulty('hard'); initializeRaceGame(); }}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                              raceDifficulty === 'hard' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            🤖
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Avatar Selection */}
                    <div className="flex items-center justify-end mb-2">
                      <button
                        onClick={() => setShowAvatarModal(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-white border border-emerald-300 rounded-full hover:bg-emerald-50 transition-all text-sm"
                      >
                        <span className="text-xl">{userAvatar}</span>
                        <span className="text-xs text-emerald-600">{currentLanguage === 'tamil' ? 'அவதாரம்' : 'Avatar'}</span>
                      </button>
                    </div>
                    
                    {/* Visual Race Track */}
                    {/* Forest Race Track */}
                    <div className="relative h-80 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8C8 35%, #228B22 65%, #1a5c1a 100%)' }}>
                      {/* Sky elements */}
                      <div className="absolute top-4 left-5 text-3xl opacity-80">☁️</div>
                      <div className="absolute top-6 left-1/3 text-2xl opacity-60">☁️</div>
                      <div className="absolute top-3 right-1/4 text-4xl opacity-70">☁️</div>
                      <div className="absolute top-5 right-5 text-4xl">🌞</div>
                      
                      {/* Background trees */}
                      <div className="absolute bottom-28 left-1 text-4xl">🌲</div>
                      <div className="absolute bottom-32 left-12 text-5xl">🌳</div>
                      <div className="absolute bottom-28 left-24 text-4xl">🌲</div>
                      <div className="absolute bottom-32 right-24 text-5xl">🌳</div>
                      <div className="absolute bottom-28 right-12 text-4xl">🌲</div>
                      <div className="absolute bottom-36 left-1/2 -translate-x-1/2 text-6xl">🌳</div>
                      
                      {/* Flowers */}
                      <div className="absolute bottom-16 left-16 text-lg">🌸</div>
                      <div className="absolute bottom-14 right-1/3 text-lg">🌺</div>
                      <div className="absolute bottom-18 left-1/2 text-lg">🌼</div>
                      
                      {/* Wide winding dirt path with two lanes - SVG */}
                      <svg className="absolute bottom-0 left-0 right-0 h-44 w-full" viewBox="0 0 400 130" preserveAspectRatio="none">
                        <path d="M -10 105 Q 50 65, 100 85 T 200 70 T 300 90 T 410 55" stroke="#4a3728" strokeWidth="55" fill="none" strokeLinecap="round" />
                        <path d="M -10 105 Q 50 65, 100 85 T 200 70 T 300 90 T 410 55" stroke="#8B7355" strokeWidth="48" fill="none" strokeLinecap="round" />
                        <path d="M -10 105 Q 50 65, 100 85 T 200 70 T 300 90 T 410 55" stroke="#a08060" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="12 8" />
                      </svg>
                      
                      {/* Start flag */}
                      <div className="absolute bottom-24 left-3 text-2xl">🚩</div>
                      
                      {/* Finish line */}
                      <div className="absolute bottom-16 right-5 text-2xl">🏁</div>
                      
                      {/* Player running on upper lane */}
                      <div 
                        className="absolute text-4xl transition-all duration-500 ease-out animate-run drop-shadow-lg"
                        style={{ 
                          left: `${Math.min(3 + (playerProgress / (raceWords.length + playerProgress || 1)) * 82, 85)}%`,
                          bottom: `${60 + Math.sin((playerProgress / (raceWords.length + playerProgress || 1)) * Math.PI * 2) * 10}px`,
                          transform: 'scaleX(-1)'
                        }}
                      >
                        {userAvatar}
                      </div>
                      
                      {/* Robot running on lower lane */}
                      <div 
                        className="absolute text-4xl transition-all duration-500 ease-out animate-run drop-shadow-lg"
                        style={{ 
                          left: `${Math.min(3 + (aiProgress / (raceWords.length + playerProgress || 1)) * 82, 85)}%`,
                          bottom: `${24 + Math.sin((aiProgress / (raceWords.length + playerProgress || 1)) * Math.PI * 2) * 10}px`
                        }}
                      >
                        🤖
                      </div>
                      
                      {/* Player label */}
                      <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow flex items-center gap-1">
                        <span style={{ transform: 'scaleX(-1)' }}>{userAvatar}</span> {playerProgress}
                      </div>
                      
                      {/* Robot label */}
                      <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                        🤖 {aiProgress}
                      </div>
                    </div>
                    
                    {/* Word Pool */}
                    {raceResult === 'none' && (
                      <div className="mt-3">
                        <p className="text-green-700 text-xs mb-2 text-center">
                          {currentLanguage === 'tamil' 
                            ? `சொல் #${playerProgress + 1} ஐத் தேர்ந்தெடுக்கவும்`
                            : `Select word #${playerProgress + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {raceWords.map((word) => (
                            <button
                              key={word.id}
                              onClick={() => handleRaceWordClick(word)}
                              className="bg-gradient-to-br from-green-400 to-emerald-500 text-white px-3 py-1.5 rounded-lg font-tamil text-sm font-medium cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-105"
                            >
                              {word.word}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Win Result */}
                    {raceResult === 'win' && (
                      <div className="mt-3 text-center py-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl relative overflow-hidden">
                        {/* Sparkle effects */}
                        <div className="absolute inset-0 pointer-events-none">
                          <span className="absolute text-lg animate-twinkle" style={{ top: '10%', left: '15%', animationDelay: '0s' }}>✨</span>
                          <span className="absolute text-base animate-twinkle" style={{ top: '20%', right: '20%', animationDelay: '0.2s' }}>⭐</span>
                          <span className="absolute text-lg animate-twinkle" style={{ top: '50%', left: '8%', animationDelay: '0.4s' }}>✨</span>
                          <span className="absolute text-base animate-twinkle" style={{ top: '30%', right: '10%', animationDelay: '0.6s' }}>🌟</span>
                          <span className="absolute text-lg animate-twinkle" style={{ bottom: '20%', left: '18%', animationDelay: '0.3s' }}>⭐</span>
                          <span className="absolute text-base animate-twinkle" style={{ bottom: '25%', right: '15%', animationDelay: '0.5s' }}>✨</span>
                        </div>
                        
                        {/* Dancing avatar with trophy */}
                        <div className="relative inline-block">
                          <span className="text-5xl inline-block animate-dance">{userAvatar}</span>
                          <span className="text-3xl ml-1">🏆</span>
                        </div>
                        
                        <p className="text-xl font-bold text-green-700 mt-2">{currentLanguage === 'tamil' ? 'வெற்றி!' : 'You Win!'}</p>
                        <p className="text-green-600 text-xs">+15 {currentLanguage === 'tamil' ? 'புள்ளிகள்' : 'points'}</p>
                        <button onClick={initializeRaceGame} className="mt-2 px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 relative z-10">
                          {currentLanguage === 'tamil' ? '🔄 மீண்டும் போட்டி' : '🔄 Race Again'}
                        </button>
                      </div>
                    )}
                    
                    {/* Lose Result */}
                    {raceResult === 'lose' && (
                      <div className="mt-3 text-center py-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
                        <div className="text-4xl mb-1">🤖🏆</div>
                        <p className="text-xl font-bold text-red-700">{currentLanguage === 'tamil' ? 'ரோபோ வென்றது!' : 'Robot Wins!'}</p>
                        <p className="text-red-600 text-xs">{currentLanguage === 'tamil' ? 'மீண்டும் முயற்சிக்கவும்!' : 'Try again!'}</p>
                        <button onClick={initializeRaceGame} className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700">
                          {currentLanguage === 'tamil' ? '🔄 மீண்டும் முயற்சி' : '🔄 Try Again'}
                        </button>
                      </div>
                    )}
                    
                    {/* Avatar Selection Modal */}
                    {showAvatarModal && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAvatarModal(false)}>
                        <div className="bg-white rounded-2xl p-5 m-4 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                          <h3 className="text-lg font-bold text-center text-emerald-700 mb-3">
                            {currentLanguage === 'tamil' ? '🎭 அவதாரத்தைத் தேர்வுசெய்க' : '🎭 Choose Avatar'}
                          </h3>
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            {avatarOptions.map((avatar) => (
                              <button
                                key={avatar}
                                onClick={() => {
                                  setUserAvatar(avatar);
                                  localStorage.setItem('thirukural-race-avatar', avatar);
                                  setShowAvatarModal(false);
                                }}
                                className={`text-3xl p-2 rounded-xl transition-all hover:scale-110 ${
                                  userAvatar === avatar 
                                    ? 'bg-emerald-100 border-2 border-emerald-500' 
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {avatar}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setShowAvatarModal(false)}
                            className="w-full py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-all"
                          >
                            {currentLanguage === 'tamil' ? 'மூடு' : 'Close'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <nav className="flex items-center justify-between pt-6">
            {prevKuralSlug ? (
              <Link
                href={`/kural-learning/${prevKuralSlug}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                {currentLanguage === 'tamil' ? 'முந்தைய' : 'Previous'}
              </Link>
            ) : <div />}

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </Link>
              <span className="text-sm text-gray-600 flex items-center">
                <input
                  type="number"
                  min="1"
                  max={totalKurals}
                  value={jumpToKural || (kuralIndex + 1)}
                  onChange={(e) => setJumpToKural(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJumpToKural()}
                  onBlur={() => setJumpToKural('')}
                  className="w-12 text-center bg-transparent border-b-2 border-gray-300 focus:border-purple-500 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{ MozAppearance: 'textfield' }}
                />
                <span className="mx-1">/</span>
                <span>{totalKurals}</span>
              </span>
            </div>

            {nextKuralSlug ? (
              <Link
                href={`/kural-learning/${nextKuralSlug}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                {currentLanguage === 'tamil' ? 'அடுத்த' : 'Next'}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ) : <div />}
          </nav>
        </div>
      </div>

      {/* New Gen Z Badge Modal */}
      <BadgeModal 
        isOpen={showBadgeModal}
        onClose={closeBadgeModal}
        language={currentLanguage}
        celebrationType={celebrationType}
      />
      
      {/* New Badge Earned Toast */}
      {newlyEarnedBadge && !showBadgeModal && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-badge-entrance">
          <div 
            className="glass-card-dark px-6 py-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:scale-105 transition-all neon-glow-purple"
            onClick={() => {
              setShowBadgeModal(true);
              setCelebrationType(newlyEarnedBadge.type === 'mastery' ? 'confetti' : newlyEarnedBadge.type === 'streak' ? 'fireworks' : 'snow');
            }}
          >
            <span className="text-4xl neon-pulse">{newlyEarnedBadge.icon}</span>
            <div>
              <div className="text-white font-bold">
                {currentLanguage === 'tamil' ? 'புதிய பேட்ஜ்!' : 'New Badge!'}
              </div>
              <div className="text-gray-300 text-sm">
                {currentLanguage === 'tamil' ? newlyEarnedBadge.nameTamil : newlyEarnedBadge.name}
              </div>
            </div>
          </div>
        </div>
      )}

      <NavigationModal
        isOpen={showNavModal}
        onClose={() => setShowNavModal(false)}
        allKuralSlugs={allKuralSlugs as NavKuralSlugMap[]}
        currentKuralId={kural.id}
        language={currentLanguage}
        visitedKurals={visitedKurals}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        totalKurals={totalKurals}
      />

      </article>
  );
}
