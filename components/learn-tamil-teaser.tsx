'use client';

import Link from 'next/link';
import PageHeader from './page-header';

interface LearnTamilTeaserProps {
    isTamil: boolean;
    isExpired?: boolean;
}

export default function LearnTamilTeaser({ isTamil, isExpired }: LearnTamilTeaserProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white py-6">
                <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Link href="/" className="shrink-0">
                            <img src="/logo.png" alt="Tamili Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-md border-2 border-white/30" />
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <span>✍️</span>
                            {isTamil ? 'தமிழ் எழுத்துக்கள்' : 'Tamil Letters'}
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100">
                    {/* Blurred Background with Letters */}
                    <div className="absolute inset-0 blur-md opacity-20 pointer-events-none select-none p-8 grid grid-cols-6 sm:grid-cols-10 gap-4">
                        {['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ஃ', 'க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'].map((l, i) => (
                            <div key={i} className="aspect-square bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                {l}
                            </div>
                        ))}
                    </div>

                    {/* Paywall Card */}
                    <div className="relative z-10 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white/80 backdrop-blur-sm">
                        <div className="h-20 w-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
                            🎨
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tight">
                            {isTamil
                                ? (isExpired ? 'உங்கள் 30 நாள் இலவச சோதனை முடிந்தது' : 'பிரீமியம் அனுமதி தேவை')
                                : (isExpired ? '30-Day Trial Expired' : 'Premium Feature')}
                        </h2>

                        <p className="text-gray-600 mb-8 max-w-md leading-relaxed font-medium">
                            {isTamil
                                ? (isExpired
                                    ? 'தொடர்ந்து தமிழ் எழுத்துக்களைக் கற்கவும் விளையாடவும் பிரீமியத்திற்கு மாற்றுங்கள்.'
                                    : 'முழுமையான தமிழ் கற்றல் அனுபவத்தைப் பெற பிரீமியத்திற்கு மாற்றுங்கள்.')
                                : (isExpired
                                    ? 'Your 30-day free trial for Tamil Learning has expired. Upgrade to Premium to continue your journey!'
                                    : 'Unlock our full interactive Tamil alphabet curriculum, writing practice, and educational games with Premium.')}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-10 text-left">
                            {[
                                { en: '✨ 18+ Letter Categories', ta: '✨ 18+ எழுத்து பிரிவுகள்' },
                                { en: '✍️ Writing Practice', ta: '✍️ எழுத்துப் பயிற்சி' },
                                { en: '🎮 Educational Games', ta: '🎮 கல்வி விளையாட்டுகள்' },
                                { en: '🏅 Achievement Badges', ta: '🏅 சாதனை பேட்ஜ்கள்' },
                            ].map(f => (
                                <div key={f.en} className="flex items-center gap-3 bg-orange-50/50 p-3 rounded-xl border border-orange-100 shadow-sm">
                                    <span className="text-orange-600 font-bold">{isTamil ? f.ta : f.en}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            <Link
                                href="/"
                                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-200 transition-all hover:scale-[1.02] active:scale-95 text-lg"
                            >
                                {isTamil ? 'இப்போதே தீர்வியுங்கள்' : 'Get Premium'}
                            </Link>
                            <Link
                                href="/"
                                className="flex-1 bg-white border-2 border-gray-100 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all text-lg"
                            >
                                {isTamil ? 'முகப்புக்குச் செல்' : 'Back to Home'}
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
