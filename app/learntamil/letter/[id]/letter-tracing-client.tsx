'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TamilLetter, LetterCategory, meiBaseLetters, uyirMarkers } from '@/lib/tamil-letters';
import AuthModal from '@/components/auth-modal';
import { useAuth } from '@/lib/use-auth';

interface Props {
  letter: TamilLetter;
  category: LetterCategory | null;
  prevLetterId: string | null;
  nextLetterId: string | null;
  letterIndex: number;
  totalLetters: number;
}

interface Point {
  x: number;
  y: number;
}

export default function LetterTracingClient({
  letter,
  category,
  prevLetterId,
  nextLetterId,
  letterIndex,
  totalLetters,
}: Props) {
  const [isTamil, setIsTamil] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const isPaidUser = user?.tier === 'paid';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    }

    const savedCompleted = localStorage.getItem('learntamil-completed');
    if (savedCompleted) {
      try {
        const completed: string[] = JSON.parse(savedCompleted);
        if (completed.includes(letter.id)) {
          setIsCompleted(true);
        }
      } catch { }
    }
  }, [letter.id]);

  useEffect(() => {
    drawCanvas();
  }, [paths, currentPath]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 200px "Noto Sans Tamil", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
    ctx.fillText(letter.letter, canvas.width / 2, canvas.height / 2);

    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    [...paths, currentPath].forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });
  }, [paths, currentPath, letter.letter]);

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getEventPosition(e);
    setIsDrawing(true);
    setCurrentPath([pos]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getEventPosition(e);
    setCurrentPath(prev => [...prev, pos]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 5) {
      setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath([]);
  };

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath([]);
    setAccuracy(0);
  };

  const checkAccuracy = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const allPoints = paths.flat();
    if (allPoints.length < 10) {
      setAccuracy(0);
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.font = 'bold 200px "Noto Sans Tamil", sans-serif';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = 'black';
    tempCtx.fillText(letter.letter, tempCanvas.width / 2, tempCanvas.height / 2);

    const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;

    let pointsOnTemplate = 0;
    let totalCheckedPoints = 0;
    const checkRadius = 15;

    for (const point of allPoints) {
      const centerX = Math.round(point.x);
      const centerY = Math.round(point.y);

      let foundOnTemplate = false;
      for (let dy = -checkRadius; dy <= checkRadius && !foundOnTemplate; dy += 3) {
        for (let dx = -checkRadius; dx <= checkRadius && !foundOnTemplate; dx += 3) {
          const px = centerX + dx;
          const py = centerY + dy;
          if (px >= 0 && px < tempCanvas.width && py >= 0 && py < tempCanvas.height) {
            const idx = (py * tempCanvas.width + px) * 4;
            if (templateData[idx + 3] > 128) {
              foundOnTemplate = true;
            }
          }
        }
      }

      if (foundOnTemplate) pointsOnTemplate++;
      totalCheckedPoints++;
    }

    let templatePixelCount = 0;
    for (let i = 3; i < templateData.length; i += 4) {
      if (templateData[i] > 128) templatePixelCount++;
    }

    const tracingAccuracy = totalCheckedPoints > 0 ? (pointsOnTemplate / totalCheckedPoints) * 100 : 0;

    const coverage = Math.min(100, allPoints.length / (templatePixelCount / 50) * 100);

    const finalScore = Math.round((tracingAccuracy * 0.7) + (Math.min(coverage, 100) * 0.3));

    setAccuracy(finalScore);
    setAttempts(prev => prev + 1);

    if (finalScore >= 70) {
      markComplete();
    }
  };

  const markComplete = () => {
    setIsCompleted(true);
    setShowCelebration(true);

    const savedCompleted = localStorage.getItem('learntamil-completed');
    let completed: string[] = [];
    if (savedCompleted) {
      try {
        completed = JSON.parse(savedCompleted);
      } catch { }
    }

    if (!completed.includes(letter.id)) {
      completed.push(letter.id);
      localStorage.setItem('learntamil-completed', JSON.stringify(completed));
    }

    if (category) {
      const categoryLetterIds = category.letters.map(l => l.id);
      const allCategoryCompleted = categoryLetterIds.every(id => completed.includes(id));

      if (allCategoryCompleted) {
        const savedBadges = localStorage.getItem('learntamil-badges');
        let badges: { categoryId: string; earnedAt: number }[] = [];
        if (savedBadges) {
          try {
            badges = JSON.parse(savedBadges);
          } catch { }
        }

        if (!badges.some(b => b.categoryId === category.id)) {
          badges.push({ categoryId: category.id, earnedAt: Date.now() });
          localStorage.setItem('learntamil-badges', JSON.stringify(badges));
        }
      }
    }

    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
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
            <div className="text-4xl font-bold text-orange-600">
              {isTamil ? 'அருமை!' : 'Great Job!'}
            </div>
          </div>
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              >
                {['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)]}
              </div>
            ))}
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/learntamil" className="p-2 hover:bg-white/20 rounded-full transition">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{letter.letter}</span>
                  {letter.id.startsWith('uyirmei-') && (() => {
                    const parts = letter.id.replace('uyirmei-', '').split('-');
                    if (parts.length === 2) {
                      const [meiName, uyirName] = parts;
                      const mei = meiBaseLetters.find(m => m.name === meiName);
                      const uyir = uyirMarkers.find(u => u.name === uyirName);
                      if (mei && uyir) {
                        return (
                          <span className="text-sm opacity-80 bg-white/20 px-2 py-0.5 rounded-full">
                            {mei.mei} + {uyir.uyir} = {letter.letter}
                          </span>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
                {category && (
                  <p className="text-xs opacity-75">
                    {isTamil ? category.nameTamil : category.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                {letterIndex + 1} / {totalLetters}
              </span>
              <div className="flex items-center gap-1.5 ml-1">
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
                          <p className="text-xs font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
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

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div
            ref={containerRef}
            className="relative aspect-square max-w-md mx-auto bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-orange-200 rounded-xl m-4"
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {isCompleted && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <span>✓</span>
                {isTamil ? 'முடிந்தது' : 'Completed'}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <button
                onClick={clearCanvas}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
                {isTamil ? 'அழி' : 'Clear'}
              </button>

              <button
                onClick={checkAccuracy}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {isTamil ? 'சரிபார்' : 'Check'}
              </button>
            </div>

            {accuracy > 0 && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full">
                  <span className="font-bold">{accuracy}%</span>
                  <span className="text-sm">
                    {accuracy >= 80 ? '🌟 Excellent!' : accuracy >= 60 ? '👍 Good!' : '💪 Keep trying!'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={() => prevLetterId && router.push(`/learntamil/letter/${prevLetterId}`)}
                disabled={!prevLetterId}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                {isTamil ? 'முந்தைய' : 'Previous'}
              </button>

              <button
                onClick={() => nextLetterId && router.push(`/learntamil/letter/${nextLetterId}`)}
                disabled={!nextLetterId}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition"
              >
                {isTamil ? 'அடுத்த' : 'Next'}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>📖</span>
            {isTamil ? 'எழுத்து பற்றி' : 'About this letter'}
          </h3>
          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-medium">{isTamil ? 'எழுத்து:' : 'Letter:'}</span>{' '}
              <span className="text-2xl">{letter.letter}</span>
            </p>
            <p>
              <span className="font-medium">{isTamil ? 'உச்சரிப்பு:' : 'Pronunciation:'}</span>{' '}
              {letter.pronunciation}
            </p>
            <p>
              <span className="font-medium">{isTamil ? 'வகை:' : 'Category:'}</span>{' '}
              {category ? (isTamil ? category.nameTamil : category.name) : '-'}
            </p>
          </div>
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
