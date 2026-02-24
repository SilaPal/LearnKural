'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Card {
  id: number;
  letter: string;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const tamilLetters = [
  'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ',
  'க', 'ச', 'ட', 'த', 'ப', 'ம',
];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function createCards(pairCount: number): Card[] {
  const selectedLetters = shuffleArray(tamilLetters).slice(0, pairCount);
  const cards: Card[] = [];
  
  selectedLetters.forEach((letter, idx) => {
    cards.push({ id: idx * 2, letter, pairId: idx, isFlipped: false, isMatched: false });
    cards.push({ id: idx * 2 + 1, letter, pairId: idx, isFlipped: false, isMatched: false });
  });
  
  return shuffleArray(cards);
}

export default function MemoryGameClient() {
  const [isTamil, setIsTamil] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    }
    setCards(createCards(6));
  }, []);

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    
    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);
    
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards.find(c => c.id === firstId)!;
      const secondCard = newCards.find(c => c.id === secondId)!;
      
      if (firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.pairId === firstCard.pairId ? { ...c, isMatched: true } : c
          ));
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === 6) {
              setIsComplete(true);
              setShowCelebration(true);
              setTimeout(() => setShowCelebration(false), 3000);
            }
            return newMatches;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const restartGame = () => {
    setCards(createCards(6));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setIsComplete(false);
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
            <div className="text-4xl font-bold text-green-600">
              {isTamil ? 'வெற்றி!' : 'You Win!'}
            </div>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-green-500 to-teal-500 text-white py-4">
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
                  {isTamil ? 'நினைவு விளையாட்டு' : 'Memory Match'}
                </h1>
                <p className="text-sm opacity-75">
                  {isTamil ? 'ஒத்த எழுத்துக்களை கண்டுபிடி' : 'Find matching letter pairs'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleLanguage}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              {isTamil ? `நகர்வுகள்: ${moves}` : `Moves: ${moves}`}
            </span>
            <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
              {isTamil ? `பொருத்தம்: ${matches}/6` : `Matches: ${matches}/6`}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isFlipped || card.isMatched}
                className={`aspect-square rounded-xl text-4xl sm:text-5xl font-bold transition-all duration-300 transform ${
                  card.isMatched
                    ? 'bg-green-100 border-2 border-green-500 text-green-600 scale-95'
                    : card.isFlipped
                      ? 'bg-teal-500 text-white rotate-y-180'
                      : 'bg-gradient-to-br from-green-400 to-teal-500 text-white hover:scale-105 cursor-pointer'
                }`}
              >
                {card.isFlipped || card.isMatched ? card.letter : '?'}
              </button>
            ))}
          </div>

          {isComplete && (
            <div className="mt-6 text-center">
              <p className="text-xl font-bold text-green-600 mb-4">
                {moves <= 10 
                  ? (isTamil ? 'அருமை! நினைவாற்றல் சிறப்பு!' : 'Amazing memory!')
                  : moves <= 15
                    ? (isTamil ? 'நன்றாக செய்தீர்கள்!' : 'Well done!')
                    : (isTamil ? 'முடித்துவிட்டீர்கள்!' : 'Completed!')}
              </p>
              <button
                onClick={restartGame}
                className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition"
              >
                {isTamil ? 'மீண்டும் விளையாடு' : 'Play Again'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
