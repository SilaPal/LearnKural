'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { meiBaseLetters, uyirMarkers } from '@/lib/tamil-letters';

interface QuizQuestion {
  letter: string;
  meiBase: string;
  uyir: string;
  options: { mei: string; uyir: string }[];
  correctIndex: number;
}

function generateQuiz(count: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomMei = meiBaseLetters[Math.floor(Math.random() * meiBaseLetters.length)];
    const randomUyir = uyirMarkers[Math.floor(Math.random() * uyirMarkers.length)];
    
    const letter = randomMei.base + randomUyir.marker;
    
    const options: { mei: string; uyir: string }[] = [];
    const correctOption = { mei: randomMei.mei, uyir: randomUyir.uyir };
    
    while (options.length < 3) {
      const wrongMei = meiBaseLetters[Math.floor(Math.random() * meiBaseLetters.length)];
      const wrongUyir = uyirMarkers[Math.floor(Math.random() * uyirMarkers.length)];
      const wrongOption = { mei: wrongMei.mei, uyir: wrongUyir.uyir };
      
      if (wrongMei.mei !== randomMei.mei || wrongUyir.uyir !== randomUyir.uyir) {
        if (!options.some(o => o.mei === wrongOption.mei && o.uyir === wrongOption.uyir)) {
          options.push(wrongOption);
        }
      }
    }
    
    const correctIndex = Math.floor(Math.random() * 4);
    options.splice(correctIndex, 0, correctOption);
    
    questions.push({
      letter,
      meiBase: randomMei.base,
      uyir: randomUyir.uyir,
      options,
      correctIndex,
    });
  }
  
  return questions;
}

export default function UyirmeiQuizClient() {
  const [isTamil, setIsTamil] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('thirukural-language');
    if (savedLang === 'tamil') {
      setIsTamil(true);
    }
    setQuestions(generateQuiz(10));
  }, []);

  const handleAnswer = (optionIndex: number) => {
    if (answered !== null) return;
    
    setAnswered(optionIndex);
    
    if (optionIndex === questions[currentIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setAnswered(null);
      } else {
        setIsComplete(true);
        if (score + (optionIndex === questions[currentIndex].correctIndex ? 1 : 0) >= 7) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setQuestions(generateQuiz(10));
    setCurrentIndex(0);
    setScore(0);
    setAnswered(null);
    setIsComplete(false);
  };

  const toggleLanguage = () => {
    const newLang = !isTamil;
    setIsTamil(newLang);
    localStorage.setItem('thirukural-language', newLang ? 'tamil' : 'english');
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <>
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-4xl font-bold text-purple-600">
              {isTamil ? 'அருமை!' : 'Excellent!'}
            </div>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4">
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
                  {isTamil ? 'உயிர்மெய் வினாடி வினா' : 'Uyirmei Quiz'}
                </h1>
                <p className="text-sm opacity-75">
                  {isTamil ? 'சரியான எழுத்து கூட்டணியைத் தேர்ந்தெடுக்கவும்' : 'Select the correct letter combination'}
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
        {!isComplete ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-gray-500">
                {isTamil ? `கேள்வி ${currentIndex + 1} / ${questions.length}` : `Question ${currentIndex + 1} / ${questions.length}`}
              </span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {isTamil ? `மதிப்பெண்: ${score}` : `Score: ${score}`}
              </span>
            </div>

            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">
                {isTamil 
                  ? 'இந்த எழுத்தை உருவாக்க எந்த மெய் + உயிர் சேர்க்கவேண்டும்?' 
                  : 'Which consonant + vowel makes this letter?'}
              </p>
              <div className="text-9xl font-bold text-purple-600 py-8">
                {currentQuestion.letter}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = idx === currentQuestion.correctIndex;
                const isSelected = answered === idx;
                
                let bgColor = 'bg-gray-50 hover:bg-purple-50 border-gray-200';
                if (answered !== null) {
                  if (isCorrect) {
                    bgColor = 'bg-green-100 border-green-500';
                  } else if (isSelected) {
                    bgColor = 'bg-red-100 border-red-500';
                  }
                }
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered !== null}
                    className={`p-6 rounded-xl border-2 transition ${bgColor} ${answered !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-center">
                      <span className="text-4xl font-bold text-gray-800">{option.mei}</span>
                      <span className="text-2xl text-gray-500 mx-2">+</span>
                      <span className="text-4xl font-bold text-gray-800">{option.uyir}</span>
                    </div>
                    {answered !== null && isCorrect && (
                      <div className="text-green-600 text-sm mt-2 font-medium">
                        ✓ {isTamil ? 'சரி!' : 'Correct!'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">
              {score >= 8 ? '🏆' : score >= 5 ? '👍' : '💪'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isTamil ? 'வினாடி வினா முடிந்தது!' : 'Quiz Complete!'}
            </h2>
            <p className="text-4xl font-bold text-purple-600 mb-4">
              {score} / {questions.length}
            </p>
            <p className="text-gray-600 mb-6">
              {score >= 8 
                ? (isTamil ? 'அற்புதம்! நீங்கள் உயிர்மெய் நிபுணர்!' : 'Amazing! You are an Uyirmei expert!')
                : score >= 5 
                  ? (isTamil ? 'நன்றாக செய்தீர்கள்! தொடர்ந்து பயிற்சி செய்யுங்கள்!' : 'Good job! Keep practicing!')
                  : (isTamil ? 'மீண்டும் முயற்சிக்கவும்!' : 'Try again!')}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={restartQuiz}
                className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition"
              >
                {isTamil ? 'மீண்டும் விளையாடு' : 'Play Again'}
              </button>
              <Link
                href="/learntamil"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition"
              >
                {isTamil ? 'திரும்பு' : 'Back'}
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
