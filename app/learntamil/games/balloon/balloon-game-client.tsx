'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AuthModal from '@/components/auth-modal';
import { useAuth } from '@/lib/use-auth';

interface Balloon {
  id: number;
  letter: string;
  x: number;
  y: number;
  color: string;
  isPopped: boolean;
}

const tamilLetters = [
  'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ',
  'க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன',
];

const balloonColors = [
  'from-red-400 to-red-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-yellow-400 to-yellow-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
];

export default function BalloonGameClient() {
  const [isTamil, setIsTamil] = useState(false);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [targetLetter, setTargetLetter] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [balloonId, setBalloonId] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const isPaidUser = user?.tier === 'paid';

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    }
  }, []);

  const getRandomLetter = useCallback(() => {
    return tamilLetters[Math.floor(Math.random() * tamilLetters.length)];
  }, []);

  const createBalloon = useCallback((): Balloon => {
    const id = balloonId;
    setBalloonId(prev => prev + 1);
    return {
      id,
      letter: getRandomLetter(),
      x: 10 + Math.random() * 80,
      y: 100 + Math.random() * 20,
      color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
      isPopped: false,
    };
  }, [balloonId, getRandomLetter]);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    const initialBalloons = Array.from({ length: 6 }, createBalloon);
    setBalloons(initialBalloons);
    setTargetLetter(initialBalloons[Math.floor(Math.random() * initialBalloons.length)].letter);
  }, [createBalloon]);

  useEffect(() => {
    startGame();
  }, []);

  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      setBalloons(prev => {
        const updated = prev.map(b => ({
          ...b,
          y: b.y - 0.5,
        })).filter(b => b.y > -20 && !b.isPopped);

        if (updated.length < 6) {
          const newBalloon = createBalloon();
          return [...updated, newBalloon];
        }
        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isGameOver, createBalloon]);

  const popBalloon = (balloon: Balloon) => {
    if (isGameOver || balloon.isPopped) return;

    if (balloon.letter === targetLetter) {
      setScore(prev => prev + 10);
      setBalloons(prev => prev.map(b =>
        b.id === balloon.id ? { ...b, isPopped: true } : b
      ));

      if (score + 10 >= 100) {
        setIsGameOver(true);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      } else {
        const remainingBalloons = balloons.filter(b => b.id !== balloon.id && !b.isPopped);
        if (remainingBalloons.length > 0) {
          setTargetLetter(remainingBalloons[Math.floor(Math.random() * remainingBalloons.length)].letter);
        } else {
          setTargetLetter(getRandomLetter());
        }
      }
    } else {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setIsGameOver(true);
        }
        return newLives;
      });
    }
  };

  const toggleLanguage = () => {
    const newLang = !isTamil;
    setIsTamil(newLang);
    localStorage.setItem('thirukural-language', newLang ? 'tamil' : 'english');
  };

  return (
    <>
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-4xl font-bold text-blue-600">
              {isTamil ? 'வெற்றி!' : 'You Win!'}
            </div>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-sky-500 to-blue-500 text-white py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/learntamil" className="p-2 hover:bg-white/20 rounded-full transition">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold">
                  {isTamil ? 'எழுத்து பலூன்' : 'Letter Pop'}
                </h1>
                <p className="text-sm opacity-75">
                  {isTamil ? 'சரியான எழுத்தை உடைக்கவும்' : 'Pop the correct letter'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="h-8 w-8 rounded-full border-2 border-white/60 shadow-lg"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-500 border-2 border-white/60 shadow-lg flex items-center justify-center text-white font-bold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                        <div className="px-3 py-2 border-b border-gray-100 text-gray-800">
                          <p className="text-xs font-semibold truncate text-left">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate text-left">{user.email}</p>
                        </div>
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
                          </div>
                        </div>
                        <button
                          onClick={async () => { await logout(); setShowUserMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          {isTamil ? 'வெளியேறு' : 'Logout'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 border border-white/40 text-white p-1.5 rounded-lg transition-all"
                    title={isTamil ? 'உள்நுழைவு / பதிவு' : 'Login / Sign Up'}
                    aria-label={isTamil ? 'உள்நுழைவு' : 'Login'}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={toggleLanguage}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-4">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {isTamil ? `மதிப்பெண்: ${score}` : `Score: ${score}`}
              </span>
              <span className="text-2xl">
                {'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">{isTamil ? 'கண்டுபிடி:' : 'Find:'}</p>
              <span className="text-4xl font-bold text-blue-600">{targetLetter}</span>
            </div>
          </div>

          <div className="relative h-[400px] bg-gradient-to-b from-sky-200 to-sky-100 overflow-hidden">
            {balloons.filter(b => !b.isPopped).map(balloon => (
              <button
                key={balloon.id}
                onClick={() => popBalloon(balloon)}
                className={`absolute transition-all duration-100 cursor-pointer hover:scale-110`}
                style={{
                  left: `${balloon.x}%`,
                  top: `${balloon.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={`w-16 h-20 rounded-full bg-gradient-to-b ${balloon.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg relative`}>
                  {balloon.letter}
                  <div className="absolute -bottom-3 left-1/2 w-1 h-6 bg-gray-400 -translate-x-1/2"></div>
                </div>
              </button>
            ))}
          </div>

          {isGameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 text-center mx-4">
                <div className="text-6xl mb-4">
                  {score >= 100 ? '🏆' : '💪'}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {score >= 100
                    ? (isTamil ? 'வெற்றி!' : 'You Win!')
                    : (isTamil ? 'விளையாட்டு முடிந்தது' : 'Game Over')}
                </h2>
                <p className="text-3xl font-bold text-blue-600 mb-4">
                  {isTamil ? `மதிப்பெண்: ${score}` : `Score: ${score}`}
                </p>
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
                >
                  {isTamil ? 'மீண்டும் விளையாடு' : 'Play Again'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isTamil={isTamil}
      />
    </>
  );
}
