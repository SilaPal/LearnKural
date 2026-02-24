'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/use-auth';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    isTamil?: boolean;
}

const FREE_FEATURES = [
    { en: 'All 1330 kurals with audio', ta: '1330 குறள்கள் + ஒலி' },
    { en: 'Kural of the Day', ta: 'தினகுறள்' },
    { en: 'Games & quizzes', ta: 'விளையாட்டு & வினாடி வினா' },
    { en: 'Progress & achievement badges', ta: 'முன்னேற்றம் & பேட்ஜ்கள்' },
    { en: 'Learn Tamil letters', ta: 'தமிழ் எழுத்து கற்க' },
    { en: 'Up to 10 favorites', ta: '10 வரை பிடித்தவை' },
];

const PAID_FEATURES = [
    { en: 'Everything in Free', ta: 'இலவசத்தில் உள்ள அனைத்தும்' },
    { en: 'Unlimited favorites', ta: 'எல்லையற்ற பிடித்தவை' },
    { en: 'Offline access (coming soon)', ta: 'இணையமின்றி (விரைவில்)' },
    { en: 'AI Tamil tutor (coming soon)', ta: 'AI தமிழ் ஆசிரியர் (விரைவில்)' },
    { en: 'Priority support', ta: 'முன்னுரிமை ஆதரவு' },
];

export default function PricingModal({ isOpen, onClose, isTamil = false }: PricingModalProps) {
    const { user } = useAuth();
    const isPaid = user?.tier === 'paid';
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setJoined(true);
            }
        } catch {
            setJoined(true);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-purple-800 via-purple-600 to-violet-500 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {isTamil ? 'திட்டத்தை தேர்ந்தெடுக்கவும்' : 'Choose Your Plan'}
                            </h2>
                            <p className="text-purple-200 text-sm mt-0.5">
                                {isTamil ? 'உங்களுக்கு ஏற்ற திட்டம் தேர்வு செய்யுங்கள்' : 'Pick what works best for you'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-purple-200 hover:text-white p-1 rounded-full hover:bg-white/20 transition"
                            aria-label="Close"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="grid sm:grid-cols-2 gap-4 p-6">
                    {/* Free Plan */}
                    <div className={`rounded-xl border-2 p-5 ${!isPaid ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-800 text-lg">
                                {isTamil ? 'இலவசம்' : 'Free'}
                            </h3>
                            {!isPaid && (
                                <span className="text-xs bg-purple-600 text-white font-semibold px-2 py-0.5 rounded-full">
                                    {isTamil ? 'தற்போதைய திட்டம்' : 'Current'}
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-extrabold text-purple-700 mb-4">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
                        <ul className="space-y-2">
                            {FREE_FEATURES.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <svg className="h-4 w-4 text-green-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                    {isTamil ? f.ta : f.en}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Premium Plan */}
                    <div className={`rounded-xl border-2 p-5 relative overflow-hidden ${isPaid ? 'border-amber-400 bg-amber-50' : 'border-violet-400 bg-gradient-to-br from-violet-50 to-purple-50'}`}>
                        {/* "Most Popular" badge */}
                        {!isPaid && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                ✨ {isTamil ? 'சிறப்பு' : 'Premium'}
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-800 text-lg">
                                {isTamil ? 'பிரீமியம்' : 'Premium'}
                            </h3>
                            {isPaid && (
                                <span className="text-xs bg-amber-500 text-white font-semibold px-2 py-0.5 rounded-full">
                                    {isTamil ? 'உங்கள் திட்டம்' : 'Your Plan ✓'}
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-extrabold text-violet-700 mb-4">
                            {isTamil ? 'விரைவில்' : 'Coming Soon'}
                            <span className="text-sm font-normal text-gray-500 ml-1"></span>
                        </p>
                        <ul className="space-y-2 mb-5">
                            {PAID_FEATURES.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <svg className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                    {isTamil ? f.ta : f.en}
                                </li>
                            ))}
                        </ul>
                        {!isPaid && (
                            joined ? (
                                <div className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                                    <p className="text-green-700 font-semibold text-sm">✅ {isTamil ? 'நீங்கள் பட்டியலில் சேர்க்கப்பட்டீர்கள்!' : "You're on the waitlist!"}</p>
                                    <p className="text-green-600 text-xs mt-1">
                                        {isTamil
                                            ? 'பிரீமியம் தொடங்கும்போது தெரிவிக்கப்படுவீர்கள்.'
                                            : "We'll notify you when Premium launches."}
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    id="upgrade-btn"
                                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow hover:shadow-lg"
                                >
                                    {loading
                                        ? (isTamil ? 'பதிவு செய்கிறது...' : 'Joining...')
                                        : (isTamil ? 'விரைவில் — அறிவிப்புக்கு பதிவு செய்யுங்கள்' : 'Coming Soon — Join Waitlist')}
                                </button>
                            )
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 pb-4">
                    {isTamil
                        ? 'கட்டணம் விரைவில் சேர்க்கப்படும். தொடர்ந்து கற்கவும்!'
                        : 'Pricing coming soon. Keep learning in the meantime!'}
                </p>
            </div>
        </div>
    );
}
