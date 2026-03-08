'use client';
import { useAvatarEmotion } from '@/lib/use-avatar-emotion';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Kural } from '@/shared/schema';
import PricingModal from '@/components/pricing-modal';
import BadgeModal from '@/components/badge-modal';
import { NavigationModal, KuralSlugMap as NavKuralSlugMap } from '@/components/navigation-modal';
import AuthModal from '@/components/auth-modal';
import { useAuth } from '@/lib/use-auth';
import { syncFavoritesToDB, syncProgressToDB, syncVisitedToDB } from '@/lib/db-sync';
import ReactingAvatar from '@/components/reacting-avatar';
import PageHeader from '@/components/page-header';
import { BadgeEarnedToast } from '@/components/badge-earned-toast';
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
  getStreakData,
  recordDailyVisit,
  Badge
} from '@/lib/badge-system';

const encouragingStatements = [
  { tm: 'அருமை! நீங்கள் ஒரு புதிய குறளை கற்றுக்கொண்டீர்கள்!', en: 'Awesome! You learned a new Kural!' },
  { tm: 'மிகச் சிறப்பு! இப்படியே தொடருங்கள்!', en: 'Excellent work! Keep it up!' },
  { tm: 'கலக்கிறீர்கள்! தமிழ் கற்றல் உங்கள் கைகளில்.', en: 'You are rocking it! Tamil learning is in your hands.' },
  { tm: 'அற்புதம்! ஒவ்வொரு சொல்லாக வெல்கிறீர்கள்.', en: 'Fantastic! Conquering it word by word.' },
  { tm: 'தொடர்ந்து கலக்குங்கள்! உங்கள் பயணம் அருமை.', en: 'Keep rocking! Your journey is amazing.' },
  { tm: 'சபாஷ்! நீங்கள் மென்மேலும் உயருகிறீர்கள்.', en: 'Bravo! You are soaring higher.' },
  { tm: 'எவ்வளவு விரைவாக கற்றுக்கொண்டீர்கள்! அசத்தல்.', en: 'How quick you learned! Mind-blowing.' },
  { tm: 'தமிழ் உங்கள் ரத்தத்தில் ஓடுகிறது. மிக நன்று!', en: 'Tamil runs in your blood. Very good!' },
  { tm: 'வார்த்தைக்கு வார்த்தை உங்கள் திறமை ஒளிர்கிறது.', en: 'Your skill shines word by word.' },
  { tm: 'இன்னொரு குறள், இன்னொரு வெற்றி!', en: 'Another Kural, another victory!' },
  { tm: 'பிரமாதம்! உங்களுடைய விடாமுயற்சிக்கு ஒரு சல்யூட்.', en: 'Brilliant! A salute to your perseverance.' },
  { tm: 'இப்படியே போனால் நீங்கள் ஒரு தமிழ் அறிஞர் ஆகிவிடுவீர்கள்!', en: 'At this rate, you will become a Tamil scholar!' },
  { tm: 'சூப்பர்! நீங்கள் குறள் உலகத்தை வென்றுவிட்டீர்கள்.', en: 'Super! You have conquered the Kural world.' },
  { tm: 'உங்கள் வேகம் வியக்க வைக்கிறது!', en: 'Your speed is surprising!' },
  { tm: 'மிக அழகு! சொற்களை கையாளுவதில் நீங்கள் மன்னன்.', en: 'So beautiful! You are a master of words.' },
  { tm: 'அருமையான முயற்சி! வெற்றி உங்கள் பக்கம்.', en: 'Great effort! Victory is on your side.' },
  { tm: 'உங்களின் இந்த சாதனைக்கு ஒரு பெரிய கைதட்டல்!', en: 'A big round of applause for this achievement!' },
  { tm: 'பிரம்மாண்டம்! நீங்கள் ஒரு குறள் சாம்பியன்.', en: 'Magnificent! You are a Kural champion.' },
  { tm: 'தமிழ் மொழி உங்கள் மூலம் மேலும் சிறப்படைகிறது.', en: 'The Tamil language is enriched through you.' },
  { tm: 'கம்பீரமான வெற்றி! அடுத்த குறளுக்குச் செல்வோமா?', en: 'Majestic win! Shall we go to the next Kural?' },
  { tm: 'அசத்துறீங்க! இது வெறும் ஆரம்பம் தான்.', en: 'You are smashing it! This is just the beginning.' },
  { tm: 'உங்கள் ஆர்வம் என்னை மெய்சிலிர்க்க வைக்கிறது.', en: 'Your enthusiasm gives me goosebumps.' },
  { tm: 'வாவ்! என்ன ஒரு அற்புதம்.', en: 'Wow! What a wonder.' },
  { tm: 'மிகச்சரியாக செய்துள்ளீர்கள்!', en: 'You did it perfectly!' },
  { tm: 'நன்றாக விளையாடினீர்கள், நன்றாகக் கற்றீர்கள்.', en: 'Played well, learned well.' },
  { tm: 'உங்கள் தமிழறிவு தினமும் வளர்கிறது.', en: 'Your Tamil knowledge grows daily.' },
  { tm: 'இந்த குறள் உங்களுக்குப் பிடித்திருக்கும் என நம்புகிறேன்.', en: 'I hope you liked this Kural.' },
  { tm: 'திறமையான செயல்! அப்படியே தொடரவும்.', en: 'Skillful performance! Keep it going.' },
  { tm: 'உங்களின் திறமைக்கு எல்லையே இல்லை.', en: 'Your talent has no limits.' },
  { tm: 'ஒவ்வொரு எழுத்தும் உங்கள் வெற்றியைப் பாடுகிறது.', en: 'Every letter sings your victory.' },
  { tm: 'உங்கள் தமிழ் உச்சரிப்பு அருமை!', en: 'Your pronunciation is great!' },
  { tm: 'மீண்டும் ஒரு முறை வென்றுவிட்டீர்கள்.', en: 'You won once again.' },
  { tm: 'உங்கள் மூளை மின்னல் வேகத்தில் வேலை செய்கிறது.', en: 'Your brain works at lightning speed.' },
  { tm: 'குறள் அறிவில் நீங்கள் ஒரு சூப்பர் ஹீரோ!', en: 'You are a superhero in Kural knowledge!' },
  { tm: 'அற்புதம்! உங்களை நினைத்து பெருமைப்படுகிறேன்.', en: 'Wonderful! I am proud of you.' },
  { tm: 'உங்கள் தமிழ்ப் பயணம் மிக இனிமையாக உள்ளது.', en: 'Your Tamil journey is very sweet.' },
  { tm: 'அசத்தல்! நீங்கள் ஒரு ஜீனியஸ்.', en: 'Awesome! You are a genius.' },
  { tm: 'நீங்கள் தொட்டதெல்லாம் துலங்குகிறது.', en: 'Everything you touch shines.' },
  { tm: 'இது ஒரு அட்டகாசமான வெற்றி.', en: 'This is a fantastic victory.' },
  { tm: 'இந்த நாள் உங்கள் வசமானது.', en: 'This day is yours.' },
  { tm: 'உங்களது விடாமுயற்சி எனக்கு ஒரு உந்துதல்.', en: 'Your persistence is an inspiration to me.' },
  { tm: 'மிகச் சிறப்பான முன்னேற்றம்!', en: 'Excellent progress!' },
  { tm: 'உங்கள் தமிழ் வாசிப்புத் திறன் அபாரம்.', en: 'Your reading skill is phenomenal.' },
  { tm: 'வெற்றிப்படிக்கட்டுகளில் நீங்கள் வேகமாக ஏறுகிறீர்கள்.', en: 'You are climbing the stairs of success rapidly.' },
  { tm: 'அழகுத் தமிழ் உங்கள் நாவில் நடனமாடுகிறது.', en: 'Beautiful Tamil dances on your tongue.' },
  { tm: 'உங்கள் ஆற்றல் அபாரமானது.', en: 'Your energy is incredible.' },
  { tm: 'மீண்டும் மீண்டும் சொல்லத் தோன்றும் அருமையான சாதனை.', en: 'A great achievement worth repeating.' },
  { tm: 'நீங்கள் ஒரு குறள் நிபுணராகி வருகிறீர்கள்.', en: 'You are becoming a Kural expert.' },
  { tm: 'இந்த அனுபவம் உங்களுக்குப் புது உற்சாகத்தைத் தரும்.', en: 'This experience will give you new excitement.' },
  { tm: 'உங்கள் திறமையைக் கண்டு வியக்கிறேன்.', en: 'I am amazed by your talent.' },
  { tm: 'கலக்கலான வெற்றி! அடுத்ததற்குத் தயாரா?', en: 'Rocking win! Ready for the next?' },
  { tm: 'உங்களின் ஈடுபாடு என்னை பிரம்மிக்க வைக்கிறது.', en: 'Your dedication astonishes me.' },
  { tm: 'நீங்கள் இன்று வரலாறு படைக்கிறீர்கள்!', en: 'You are making history today!' },
  { tm: 'அபாரமான சிந்தனை, அருமையான வெற்றி.', en: 'Incredible thinking, awesome win.' },
  { tm: 'கற்றலில் உங்களுக்கு நிகர் நீங்களே.', en: 'In learning, you are your own match.' },
  { tm: 'உங்கள் தமிழ்க் காதல் என்னை மகிழ்விக்கிறது.', en: 'Your love for Tamil makes me happy.' },
  { tm: 'நீங்கள் ஒரு ஒளிரும் நட்சத்திரம்.', en: 'You are a shining star.' },
  { tm: 'இந்த குறளின் ஆழத்தை நீங்கள் புரிந்து கொண்டீர்கள்.', en: 'You understood the depth of this Kural.' },
  { tm: 'மிகவும் நேர்த்தியான செயல்பாடு.', en: 'Very elegant performance.' },
  { tm: 'தொடர்ந்து முன்னேறுங்கள், நீங்கள் உச்சத்தை அடைவீர்கள்.', en: 'Keep moving forward, you will reach the peak.' }
];

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

type CelebrationType = 'confetti' | 'fireworks' | 'stars' | 'balloons' | 'snow' | 'golden' | null;

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

type RevealMode = 'tap' | 'ice' | 'hold' | 'scratch';

const GamifiedWord = ({
  word,
  mode,
  isNext,
  isRevealed,
  onReveal,
  equippedTool
}: {
  word: string;
  mode: RevealMode;
  isNext: boolean;
  isRevealed: boolean;
  onReveal: () => void;
  equippedTool?: 'none' | 'hammer' | 'wand' | 'coin' | 'potion';
}) => {
  const [iceTaps, setIceTaps] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isShattering, setIsShattering] = useState(false);
  const [showMagic, setShowMagic] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scratchBoundsRef = useRef<{ minX: number; maxX: number; startX: number }>({ minX: Infinity, maxX: -Infinity, startX: 0 });
  const hasRevealedRef = useRef(false);

  const handleReveal = () => {
    if (!hasRevealedRef.current) {
      hasRevealedRef.current = true;
      onReveal();
    }
  };

  // Reset internal states when "Read Again" is clicked (isRevealed becomes false)
  useEffect(() => {
    if (!isRevealed) {
      hasRevealedRef.current = false;
      setIceTaps(0);
      setHoldProgress(0);
      setScratchProgress(0);
      setIsShattering(false);
      setShowMagic(false);
      scratchBoundsRef.current = { minX: Infinity, maxX: -Infinity, startX: 0 };
    }
  }, [isRevealed]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  if (isRevealed) {
    return (
      <span className="text-lg sm:text-xl font-tamil font-bold px-4 py-3 rounded-xl transition-all duration-500 bg-indigo-50 text-indigo-900 shadow-sm border border-indigo-100 transform scale-100 opacity-100">
        {word}
      </span>
    );
  }

  if (!isNext) {
    return (
      <span className="text-lg sm:text-xl font-tamil font-bold px-4 py-3 rounded-xl bg-gray-100 text-transparent transition-all select-none opacity-50 border border-gray-200">
        {word}
      </span>
    );
  }

  // Common wrapper classes for the active "next" word
  const activeClasses = "text-lg sm:text-xl font-tamil font-bold px-4 py-3 rounded-xl transition-all cursor-pointer relative overflow-hidden select-none border-2 border-indigo-300 shadow-md bg-white text-transparent hover:shadow-lg";

  if (mode === 'tap') {
    const isWandReady = equippedTool === 'wand';
    return (
      <button
        className={`${activeClasses} ${isWandReady ? 'hover:scale-105 active:scale-95 animate-pulse' : ''}`}
        style={{
          cursor: isWandReady
            ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' style=\'font-size: 24px\'><text x=\'0\' y=\'24\'>🪄</text></svg>"), pointer'
            : 'not-allowed'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isWandReady) return;
          setShowMagic(true);
          setTimeout(() => {
            handleReveal();
            setShowMagic(false);
          }, 400); // Wait for sparkle
        }}
        disabled={showMagic}
      >
        <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center transition-opacity">
          {isWandReady ? '✨' : '👆'}
        </div>
        {showMagic && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-2xl animate-spin duration-300">
            ✨
          </div>
        )}
        <span className={`transition-opacity duration-300 ${showMagic ? 'opacity-100 text-indigo-900' : 'opacity-0'}`}>
          {word}
        </span>
      </button>
    );
  }

  if (mode === 'ice') {
    // 3 taps to break
    const opacity = iceTaps === 0 ? 'opacity-100' : iceTaps === 1 ? 'opacity-70' : 'opacity-40';
    return (
      <button
        className={`${activeClasses} active:scale-95 bg-cyan-50 overflow-hidden relative ${isShattering ? 'animate-pulse scale-110 !border-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : ''}`}
        style={{
          borderColor: '#a5f3fc',
          cursor: equippedTool === 'hammer'
            ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' style=\'font-size: 24px\'><text x=\'0\' y=\'24\'>🔨</text></svg>"), pointer'
            : 'not-allowed'
        }}
        disabled={isShattering}
        onClick={(e) => {
          e.stopPropagation();
          if (equippedTool !== 'hammer' || isShattering) return;

          if (iceTaps >= 2) {
            // Initiate shatter sequence
            setIsShattering(true);
            setIceTaps(3);
            setTimeout(() => {
              handleReveal();
              setIsShattering(false);
              setIceTaps(0);
            }, 400); // Wait for visual break
          } else {
            setIceTaps(p => p + 1);
          }
        }}
      >
        <div
          className={`absolute inset-0 bg-cyan-200/50 flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${opacity} 
            ${isShattering ? 'scale-150 opacity-0 rotate-12 blur-md' : ''}
          `}
        >
          {isShattering ? '💥' : '🧊'}
        </div>
        <span className={`transition-opacity duration-300 ${isShattering ? 'opacity-100 text-cyan-900' : 'opacity-0'}`}>
          {word}
        </span>
      </button>
    );
  }

  if (mode === 'hold') {
    const isPotionReady = equippedTool === 'potion';
    const startHold = () => {
      if (!isPotionReady) return;
      setHoldProgress(0);
      let p = 0;
      holdTimerRef.current = setInterval(() => {
        p += 5;
        setHoldProgress(p);
        if (p >= 100) {
          clearInterval(holdTimerRef.current!);
          handleReveal();
        }
      }, 30);
    };
    const endHold = () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      setHoldProgress(0);
    };

    return (
      <button
        className={`${activeClasses} transform transition-transform select-none touch-none`}
        style={{
          transform: holdProgress > 0 ? `scale(${1 + (holdProgress / 500)})` : 'scale(1)',
          cursor: isPotionReady
            ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' style=\'font-size: 24px\'><text x=\'0\' y=\'24\'>🧪</text></svg>"), pointer'
            : 'not-allowed'
        }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startHold(); }}
        onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); endHold(); }}
        onPointerCancel={endHold}
        onPointerLeave={endHold}
      >
        <div
          className="absolute left-0 bottom-0 top-0 bg-green-400/40 transition-all ease-linear"
          style={{ width: `${holdProgress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
          {isPotionReady ? '🧪' : '⚡'}
        </div>
        {word}
      </button>
    );
  }

  if (mode === 'scratch') {
    const isCoinReady = equippedTool === 'coin';

    const handleDown = (e: React.PointerEvent) => {
      if (!isCoinReady) return;
      e.currentTarget.setPointerCapture(e.pointerId);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      scratchBoundsRef.current = { minX: x, maxX: x, startX: x };
    };

    const handleMove = (e: React.PointerEvent) => {
      if (!isCoinReady) return;
      if (e.buttons > 0 || e.pointerType === 'touch') {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        let { minX, maxX } = scratchBoundsRef.current;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        scratchBoundsRef.current = { ...scratchBoundsRef.current, minX, maxX };

        // Require scratching horizontally across at least 70% of the word's width
        const distanceCovered = maxX - minX;
        const requiredDistance = width * 0.7;

        const rawProgress = Math.min(100, (distanceCovered / requiredDistance) * 100);
        setScratchProgress(rawProgress);

        if (rawProgress >= 100) {
          handleReveal();
        }
      }
    };

    return (
      <div
        className={`${activeClasses} touch-none select-none`}
        style={{
          cursor: isCoinReady
            ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' style=\'font-size: 24px\'><text x=\'0\' y=\'24\'>🪙</text></svg>"), crosshair'
            : 'not-allowed'
        }}
        onPointerDown={handleDown}
        onPointerUp={(e) => { if (isCoinReady) e.currentTarget.releasePointerCapture(e.pointerId); }}
        onPointerMove={handleMove}
      >
        <div
          className="absolute inset-0 bg-slate-300 flex items-center justify-center filter drop-shadow-sm transition-opacity duration-75"
          style={{ opacity: Math.max(0, 1 - (scratchProgress / 100)) }}
        >
          {isCoinReady ? '' : '🔒'}
        </div>
        <span className="relative z-10 opacity-80">{word}</span>
      </div>
    );
  }

  return null;
};

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

  const [revealedWordCount, setRevealedWordCount] = useState(0);
  const [revealMode, setRevealMode] = useState<RevealMode>('tap');
  const [equippedTool, setEquippedTool] = useState<'none' | 'hammer' | 'wand' | 'coin' | 'potion'>('none');
  const [encouragementIndex, setEncouragementIndex] = useState(0);
  const kuralWords = kural.kural_tamil.replace(/\\n/g, ' ').replace(/\n/g, ' ').split(/\s+/).filter(w => w.length > 0);
  const isFullyRevealed = revealedWordCount >= kuralWords.length;

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
  const { user, logout } = useAuth();
  const { emotion: avatarEmotion, react: reactAvatar } = useAvatarEmotion();
  const [totalCoins, setTotalCoins] = useState(user?.coins || 0);
  const [streakCount, setStreakCount] = useState(0);
  const isPaidUser = user?.tier === 'paid' || user?.role === 'super_admin' || user?.role === 'school_admin' || user?.role === 'teacher';
  const FREE_FAVORITES_LIMIT = 10;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

    const profileId = user?.activeProfileId || user?.id || 'guest';
    setNewBadgeCount(getUnviewedBadgeCount(user, profileId));

    const { newBadge } = updateStreak(user, profileId);
    if (newBadge) {
      saveBadge(newBadge, profileId);
      setNewlyEarnedBadge(newBadge);
      setNewBadgeCount(prev => prev + 1);
    }

    const bookmarksKey = `thirukural-bookmarks-${profileId}`;
    const visitedKey = `thirukural-visited-${profileId}`;

    const savedBookmarks = localStorage.getItem(bookmarksKey);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    const savedVisited = localStorage.getItem(visitedKey);
    if (savedVisited) {
      setVisitedKurals(JSON.parse(savedVisited).map(Number));
    }

    const streakData = getStreakData(user, profileId);
    setStreakCount(streakData.currentStreak);
    recordDailyVisit(user, profileId);

    const modes: RevealMode[] = ['tap', 'ice', 'hold', 'scratch'];
    setRevealMode(modes[Math.floor(Math.random() * modes.length)]);
    setRevealedWordCount(0); // Reset reveal on Kural change
    setEquippedTool('none');
    setEncouragementIndex(Math.floor(Math.random() * encouragingStatements.length));
  }, [kural.id, user]);

  useEffect(() => {
    if (user) {
      const profileId = user.activeProfileId || user.id;
      const visitedKey = `thirukural-visited-${profileId}`;
      const bookmarksKey = `thirukural-bookmarks-${profileId}`;

      fetch('/api/user/favorites')
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then(data => {
          if (data && Array.isArray(data)) {
            setBookmarks(data);
            localStorage.setItem(bookmarksKey, JSON.stringify(data));
          }
        })
        .catch(err => console.error('Failed to load favorites from DB', err));

      // Sync local state with server on mount
      fetch('/api/user/progress')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.completedChapters) {
            const serverVisited = Array.from(new Set(data.completedChapters)).map(Number);
            setVisitedKurals(prev => {
              const merged = Array.from(new Set([...prev, ...serverVisited]));
              localStorage.setItem(visitedKey, JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(err => console.error('Failed to sync progress', err));

      // Fetch latest coins
      fetch('/api/user/coins')
        .then(res => res.json())
        .then(data => { if (data.coins !== undefined) setTotalCoins(data.coins); })
        .catch(err => console.error('Failed to load coins', err));
    }
  }, [user]);

  useEffect(() => {
    if (user?.coins !== undefined) {
      setTotalCoins(user.coins);
    }
  }, [user?.coins]);

  useEffect(() => {
    if (!kural.id) return;
    const currentId = Number(kural.id);

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

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipod|android.*mobile/.test(userAgent) || window.innerWidth <= 768;
    const isTablet = /ipad/.test(userAgent) || (/android/.test(userAgent) && !/mobile/.test(userAgent));
    setIsDesktop(!isMobile && !isTablet);

    const hasSpeechRecognition = ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    setSpeechSupported(hasSpeechRecognition);
  }, [kural.id, user]);

  const toggleBookmark = (kuralId?: number) => {
    const id = kuralId ?? kural.id;
    // Free tier: max 10 favorites
    if (!isPaidUser && !bookmarks.includes(id) && bookmarks.length >= FREE_FAVORITES_LIMIT) {
      setShowPricingModal(true);
      return;
    }
    const profileId = user?.activeProfileId || user?.id || 'guest';
    const bookmarksKey = `thirukural-bookmarks-${profileId}`;

    const newBookmarks = bookmarks.includes(id)
      ? bookmarks.filter(b => b !== id)
      : [...bookmarks, id];
    setBookmarks(newBookmarks);
    localStorage.setItem(bookmarksKey, JSON.stringify(newBookmarks));
    if (user) syncFavoritesToDB(newBookmarks);
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
        setTimeout(() => setShakeWrongSlot(null), 500);
        reactAvatar('sad');
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
      reactAvatar('happy');
      if (newPosition === flyingWords.length) setGameSolved(true);
    } else {
      reactAvatar('sad');
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
    const isCorrect = word.correctPosition === slotIndex;
    if (isCorrect) {
      reactAvatar('happy');
    } else {
      reactAvatar('sad');
    }
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

  const speakTamilWord = (word: string, isEnglish: boolean = false) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(word);

    const voices = window.speechSynthesis.getVoices();
    if (isEnglish) {
      const englishVoice = voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      utterance.lang = 'en-US';
    } else {
      const tamilVoice = voices.find(v => v.lang.startsWith('ta'));
      if (tamilVoice) utterance.voice = tamilVoice;
      utterance.lang = 'ta-IN';
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleRevealNext = () => {
    if (revealedWordCount < kuralWords.length) {
      const nextWord = kuralWords[revealedWordCount];
      speakTamilWord(nextWord);

      const newCount = revealedWordCount + 1;
      setRevealedWordCount(newCount);

      // Last word revealed?
      if (newCount === kuralWords.length) {
        // 1. Celebrate with Avatar for 5 seconds
        reactAvatar('excited');
        setTimeout(() => reactAvatar('idle'), 5000);

        // 2. Announce the encouraging statement out loud
        setTimeout(() => {
          const statement = currentLanguage === 'tamil' ? encouragingStatements[encouragementIndex].tm : encouragingStatements[encouragementIndex].en;
          speakTamilWord(statement, currentLanguage === 'english');
        }, 2000); // Wait 2 seconds before speaking the encouragement

        // 3. Hook into Achievement and Coin System
        if (user) {
          const profileId = user.activeProfileId || user.id;
          fetch('/api/user/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity: 'word_by_word',
              coins: 5,             // Bonus coins for finishing the interaction
              profileId,
              kuralId: kural.id     // Log the context
            })
          }).catch(console.error);
        }
      }
    }
  };

  const resetReveal = () => {
    setRevealedWordCount(0);
    setEncouragementIndex(Math.floor(Math.random() * encouragingStatements.length));
  };

  const resetGame = () => {
    if (selectedGame === 'puzzle') initializePuzzle();
    else if (selectedGame === 'flying') initializeFlyingGame();
    else if (selectedGame === 'balloon') initializeBalloonGame();
    else if (selectedGame === 'race') initializeRaceGame();
  };


  const openBadgeModal = () => {
    const profileId = user?.activeProfileId || user?.id || 'guest';
    const allBadges = getAllBadges(user, profileId);
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
        setCelebrationType('stars');
      } else if (lastBadge.type === 'mastery') {
        setCelebrationType('confetti');
      } else if (lastBadge.type === 'streak') {
        setCelebrationType('fireworks');
      } else if (lastBadge.type === 'skill') {
        setCelebrationType('stars');
      }
    } else if (allBadges.length > 0) {
      setCelebrationType('stars');
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
    const profileId = user?.activeProfileId || user?.id || 'guest';
    updateKuralActivity(kural.id, activity, profileId);

    const stats = getSkillStats(profileId);

    if (activity === 'puzzle' && timeSeconds !== undefined) {
      if (stats.puzzleFastestTime === null || timeSeconds < stats.puzzleFastestTime) {
        stats.puzzleFastestTime = timeSeconds;
        saveSkillStats(stats, profileId);
      }

      const speedBadge = checkSkillBadge('speedDemon', stats, profileId);
      if (speedBadge) {
        saveBadge(speedBadge, profileId);
        setNewlyEarnedBadge(speedBadge);
        setNewBadgeCount(prev => prev + 1);
        setCelebrationType('snow');
      }
    }

    if (activity === 'balloon' && stats.balloonPerfectGames >= 0) {
      const balloonBadge = checkSkillBadge('balloonMaster', stats, profileId);
      if (balloonBadge) {
        saveBadge(balloonBadge, profileId);
        setNewlyEarnedBadge(balloonBadge);
        setNewBadgeCount(prev => prev + 1);
        setCelebrationType('confetti');
      }
    }

    if (activity === 'flying' && stats.flyingPerfectGames >= 0) {
      const flyingBadge = checkSkillBadge('flyingAce', stats, profileId);
      if (flyingBadge) {
        saveBadge(flyingBadge, profileId);
        setNewlyEarnedBadge(flyingBadge);
        setNewBadgeCount(prev => prev + 1);
        setCelebrationType('confetti');
      }
    }

    const masteredCount = getMasteredCount(profileId);
    const masteryBadge = checkMasteryBadge(masteredCount, profileId);
    if (masteryBadge) {
      saveBadge(masteryBadge, profileId);
      setNewlyEarnedBadge(masteryBadge);
      setNewBadgeCount(prev => prev + 1);
      setCelebrationType('confetti');
    }

    if (activity === 'puzzle' || activity === 'flying' || activity === 'balloon' || activity === 'race') {
      reactAvatar('excited');
    }
  }, [kural.id]);

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'tamil' ? 'english' : 'tamil';
    setCurrentLanguage(newLang);
    localStorage.setItem('thirukural-language', newLang);
    window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: newLang === 'tamil' } }));
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

      recognition.onstart = () => {
        setIsRecording(true);
        reactAvatar('thinking');
      };

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
        reactAvatar('happy');
        setTimeout(() => setPronunciationFeedback('none'), 3000);
        setTimeout(() => reactAvatar('idle'), 5000);

        // Track perfect pronunciation for skill badge
        if (result.score >= 0.8) {
          const profileId = user?.activeProfileId || user?.id || 'guest';
          const stats = getSkillStats(profileId);
          stats.perfectPronunciations = (stats.perfectPronunciations || 0) + 1;
          saveSkillStats(stats, profileId);

          const sharpBadge = checkSkillBadge('sharpEars', stats, profileId);
          if (sharpBadge) {
            saveBadge(sharpBadge, profileId);
            setNewlyEarnedBadge(sharpBadge);
            setNewBadgeCount(prev => prev + 1);
          }
        }
      } else {
        setPronunciationFeedback('failed');
        reactAvatar('sad');
        setTimeout(() => setPronunciationFeedback('none'), 2000);
        setTimeout(() => reactAvatar('idle'), 2000);
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
    <article className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <PageHeader
        onLoginClick={() => setShowAuthModal(true)}
        onUpgradeClick={() => setShowPricingModal(true)}
        onBadgesClick={openBadgeModal}
        newBadgeCount={newBadgeCount}
        title={currentLanguage === 'tamil' ? `திருக்குறள் ${kural.id}` : `Thirukkural ${kural.id}`}
        gradientClass="bg-gradient-to-br from-purple-800 via-purple-600 to-violet-500"
        onToggleFavorite={user ? () => toggleBookmark() : undefined}
        isFavorited={bookmarks.includes(kural.id)}
        isTamil={currentLanguage === 'tamil'}
        toggleLanguage={toggleLanguage}
        streakCount={new Set(visitedKurals).size}
        coinCount={totalCoins}
        onStreakClick={() => setShowNavModal(true)}
        onCoinClick={openBadgeModal}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">

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

        {/* --- START OF WORD BY WORD REVEAL SECTION --- */}
        {/* You can comment out this entire <section> to disable the feature */}
        <section
          className="mb-8 bg-white rounded-2xl shadow-lg border-2 border-indigo-100 p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-800">
              {currentLanguage === 'tamil' ? 'படிப்படியாக வாசிக்க' : 'Read Word by Word'}
            </h3>

            {/* Mode Selector */}
            <div className="flex flex-wrap items-center gap-2 bg-indigo-50/50 p-1.5 rounded-xl border border-indigo-100">
              {(['tap', 'ice', 'hold', 'scratch'] as RevealMode[]).map((m) => (
                <button
                  key={m}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRevealMode(m);
                    setEquippedTool('none');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${revealMode === m
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200 scale-105'
                    : 'text-indigo-500 hover:bg-indigo-100/50 hover:text-indigo-600'
                    }`}
                  title={`Switch to ${m} mode`}
                >
                  {m === 'tap' && '👆'}
                  {m === 'ice' && '🧊'}
                  {m === 'hold' && '⚡'}
                  {m === 'scratch' && '🪙'}
                </button>
              ))}
            </div>

            {isFullyRevealed && (
              <button
                onClick={(e) => { e.stopPropagation(); resetReveal(); }}
                className="text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-100 px-4 py-2 rounded-full hover:bg-indigo-200 transition-colors shadow-sm ml-auto sm:ml-0"
              >
                {currentLanguage === 'tamil' ? 'மீண்டும் வாசிக்க' : 'Read Again'}
              </button>
            )}
          </div>

          {!isFullyRevealed && (
            <div className="mb-6 text-center flex flex-col items-center justify-center gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm animate-pulse shadow-indigo-100/50">
                {revealMode === 'tap' && equippedTool !== 'wand' && (currentLanguage === 'tamil' ? '🪄 மந்திரக்கோலை எடுக்கவும்' : '🪄 Take the magic wand')}
                {revealMode === 'tap' && equippedTool === 'wand' && (currentLanguage === 'tamil' ? '👆 படிக்கச் சொல்லின் மீது தட்டவும்' : '👆 Tap on the word to reveal it')}
                {revealMode === 'ice' && equippedTool !== 'hammer' && (currentLanguage === 'tamil' ? '🧊 பனியை உடைக்க சுத்தியலை எடுக்கவும்' : '🧊 Take the hammer to break the ice')}
                {revealMode === 'ice' && equippedTool === 'hammer' && (currentLanguage === 'tamil' ? '🔨 3 முறை தட்டி பனியை உடைக்கவும்' : '🔨 Tap 3 times to break the ice')}
                {revealMode === 'hold' && equippedTool !== 'potion' && (currentLanguage === 'tamil' ? '🧪 மந்திர திரவத்தை எடுக்கவும்' : '🧪 Take the magic potion')}
                {revealMode === 'hold' && equippedTool === 'potion' && (currentLanguage === 'tamil' ? '⚡ அழுத்திப் பிடித்து நிரப்பவும்' : '⚡ Press and hold to fill')}
                {revealMode === 'scratch' && equippedTool !== 'coin' && (currentLanguage === 'tamil' ? '🪙 நாணயத்தை எடுக்கவும்' : '🪙 Take the coin')}
                {revealMode === 'scratch' && equippedTool === 'coin' && (currentLanguage === 'tamil' ? '🪙 சொல்லின் மீது தேய்த்து அழிக்கவும்' : '🪙 Scratch over the word to reveal')}
              </span>

              {revealMode === 'ice' && equippedTool !== 'hammer' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEquippedTool('hammer'); }}
                  className="mt-2 flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-5 py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform"
                >
                  <span className="text-2xl animate-bounce">🔨</span>
                  <span className="font-bold">{currentLanguage === 'tamil' ? 'சுத்தியலை எடு' : 'Take Hammer'}</span>
                </button>
              )}
              {revealMode === 'tap' && equippedTool !== 'wand' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEquippedTool('wand'); }}
                  className="mt-2 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-fuchsia-500 text-white px-5 py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform"
                >
                  <span className="text-2xl animate-bounce">🪄</span>
                  <span className="font-bold">{currentLanguage === 'tamil' ? 'மந்திரக்கோலை எடு' : 'Take Wand'}</span>
                </button>
              )}
              {revealMode === 'hold' && equippedTool !== 'potion' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEquippedTool('potion'); }}
                  className="mt-2 flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-5 py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform"
                >
                  <span className="text-2xl animate-bounce">🧪</span>
                  <span className="font-bold">{currentLanguage === 'tamil' ? 'திரவத்தை எடு' : 'Take Potion'}</span>
                </button>
              )}
              {revealMode === 'scratch' && equippedTool !== 'coin' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEquippedTool('coin'); }}
                  className="mt-2 flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform"
                >
                  <span className="text-2xl animate-bounce">🪙</span>
                  <span className="font-bold">{currentLanguage === 'tamil' ? 'நாணயத்தை எடு' : 'Take Coin'}</span>
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-6 items-center w-full max-w-2xl mx-auto min-h-[160px] justify-center">
            {/* Top Row: First 4 words */}
            <div className="flex flex-wrap gap-x-4 gap-y-6 justify-center w-full">
              {kuralWords.slice(0, 4).map((word, index) => (
                <GamifiedWord
                  key={`top-${index}`}
                  word={word}
                  mode={revealMode}
                  isNext={index === revealedWordCount}
                  isRevealed={index < revealedWordCount}
                  onReveal={handleRevealNext}
                  equippedTool={equippedTool}
                />
              ))}
            </div>

            {/* Bottom Row: Remaining 3 words */}
            <div className="flex flex-wrap gap-x-4 gap-y-6 justify-center w-full">
              {kuralWords.slice(4, 7).map((word, index) => (
                <GamifiedWord
                  key={`bottom-${index}`}
                  word={word}
                  mode={revealMode}
                  isNext={(index + 4) === revealedWordCount}
                  isRevealed={(index + 4) < revealedWordCount}
                  onReveal={handleRevealNext}
                  equippedTool={equippedTool}
                />
              ))}
            </div>
          </div>

          {isFullyRevealed && (
            <div className="mt-8 text-center text-sm font-medium text-emerald-800 bg-emerald-50 py-4 px-6 rounded-2xl border-2 border-emerald-200 shadow-sm animate-fade-in transform transition-all scale-100 hover:scale-[1.02]">
              <p className="text-lg">✨</p>
              {currentLanguage === 'tamil' ? encouragingStatements[encouragementIndex].tm : encouragingStatements[encouragementIndex].en}
            </div>
          )}
        </section>
        {/* --- END OF WORD BY WORD REVEAL SECTION --- */}


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
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 transform hover:scale-105 mx-auto mb-4 ${isPlaying
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
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 transform hover:scale-105 mx-auto mb-4 ${isRecording
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
                            <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                            <line x1="8" y1="22" x2="16" y2="22" />
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
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
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
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out ${contentMode === 'video'
                    ? 'left-1 bg-purple-600'
                    : 'left-[calc(50%+2px)] bg-green-600'
                    }`}
                />
                <button
                  onClick={() => setContentMode('video')}
                  className={`relative z-10 py-1.5 px-4 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${contentMode === 'video' ? 'text-white' : 'text-gray-500'
                    }`}
                >
                  ▶️ {currentLanguage === 'tamil' ? 'காணொளி' : 'Video'}
                </button>
                <button
                  onClick={() => setContentMode('games')}
                  className={`relative z-10 py-1.5 px-4 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${contentMode === 'games' ? 'text-white' : 'text-gray-500'
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
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition ${selectedGame === 'puzzle' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    🧩 {currentLanguage === 'tamil' ? 'புதிர்' : 'Puzzle'}
                  </button>
                  <button
                    onClick={() => setSelectedGame('flying')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition ${selectedGame === 'flying' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    🦋 {currentLanguage === 'tamil' ? 'பறக்கும்' : 'Flying'}
                  </button>
                  <button
                    onClick={() => setSelectedGame('balloon')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition ${selectedGame === 'balloon' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    🎈 {currentLanguage === 'tamil' ? 'பலூன்' : 'Balloon'}
                  </button>
                  <button
                    onClick={() => setSelectedGame('race')}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition ${selectedGame === 'race' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${puzzleTimer <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-blue-600'
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
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${flyingSpeed === 'slow'
                              ? 'bg-green-500 text-white'
                              : 'text-gray-500 hover:bg-gray-100'
                              }`}
                            title={currentLanguage === 'tamil' ? 'மெதுவாக' : 'Slow'}
                          >
                            🐢
                          </button>
                          <button
                            onClick={() => setFlyingSpeed('medium')}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${flyingSpeed === 'medium'
                              ? 'bg-yellow-500 text-white'
                              : 'text-gray-500 hover:bg-gray-100'
                              }`}
                            title={currentLanguage === 'tamil' ? 'நடுத்தரம்' : 'Medium'}
                          >
                            🐇
                          </button>
                          <button
                            onClick={() => setFlyingSpeed('fast')}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${flyingSpeed === 'fast'
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
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${raceDifficulty === 'easy' ? 'bg-green-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                              }`}
                          >
                            😊
                          </button>
                          <button
                            onClick={() => { setRaceDifficulty('medium'); initializeRaceGame(); }}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${raceDifficulty === 'medium' ? 'bg-yellow-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                              }`}
                          >
                            😎
                          </button>
                          <button
                            onClick={() => { setRaceDifficulty('hard'); initializeRaceGame(); }}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${raceDifficulty === 'hard' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'
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
                                className={`text-3xl p-2 rounded-xl transition-all hover:scale-110 ${userAvatar === avatar
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
        <BadgeEarnedToast
          badge={newlyEarnedBadge}
          isTamil={currentLanguage === 'tamil'}
          onDismiss={() => setNewlyEarnedBadge(null)}
          onViewAchievements={openBadgeModal}
        />
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

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        isTamil={currentLanguage === 'tamil'}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isTamil={currentLanguage === 'tamil'}
      />

      {/* Floating Avatar */}
      {user && <ReactingAvatar emotion={avatarEmotion} />}
    </article>
  );
}
