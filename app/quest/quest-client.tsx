'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/use-auth';
import PageHeader from '@/components/page-header';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';
import PricingModal from '@/components/pricing-modal';

const WorldMap = dynamic(() => import('@/components/world-map'), { ssr: false });

interface QuestNode {
    chapter_number: number;
    chapter_ta: string;
    chapter_en: string;
    firstKuralId: number;
}

interface Kingdom {
    id: string; // virtue, wealth, love
    name_en: string;
    name_ta: string;
    nodes: QuestNode[];
}

interface Props {
    kingdoms: Kingdom[];
}

export default function QuestClient({ kingdoms }: Props) {
    const { user } = useAuth();
    const [completedChapters, setCompletedChapters] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);

    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);

        const handler = (e: Event) => setIsTamil((e as CustomEvent<{ isTamil: boolean }>).detail.isTamil);
        window.addEventListener('tamillanguagechange', handler);
        return () => window.removeEventListener('tamillanguagechange', handler);
    }, []);

    useEffect(() => {
        if (user) {
            fetch('/api/user/progress')
                .then(res => res.json())
                .then(data => {
                    if (data?.completedChapters) {
                        setCompletedChapters(data.completedChapters);
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleNodeClick = (node: QuestNode, isLocked: boolean) => {
        if (isLocked) {
            if (isTamil) alert('இந்த பகுதியை அணுக முந்தைய அத்தியாயங்களை முடிக்கவும்!');
            else alert('Complete previous chapters to unlock this Kingdom!');
            return;
        }

        // Launch Kural Playing with Puzzle game specifically for this Chapter
        router.push(`/kural-playing?game=puzzle&kuralId=${node.firstKuralId}&chapter=${node.chapter_number}`);
    };

    const toggleLanguage = () => {
        const next = !isTamil;
        setIsTamil(next);
        localStorage.setItem('thirukural-language', next ? 'tamil' : 'english');
        window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: next } }));
    };

    const getKingdomTheme = (id: string) => {
        switch (id.toLowerCase()) {
            case 'virtue':
                return { bg: 'from-green-100 to-emerald-200', border: 'border-emerald-500', icon: '🌿' };
            case 'wealth':
                return { bg: 'from-amber-100 to-yellow-300', border: 'border-yellow-600', icon: '💎' };
            case 'love':
                return { bg: 'from-pink-100 to-rose-200', border: 'border-rose-500', icon: '❤️' };
            default:
                return { bg: 'from-gray-100 to-gray-200', border: 'border-gray-500', icon: '🗺️' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="animate-pulse text-xl text-orange-600 font-bold">Loading Your Quest...</div>
            </div>
        );
    }

    // Determine Locks
    // Virtue is always unlocked. Wealth unlocks if Virtue (Ch 1-38) has at least 10 completions or user finishes Aram? Let's say if user completed at least 5 chapters, Wealth unlocks.
    const aramCompletions = completedChapters.filter(ch => ch <= 38).length;
    const porulCompletions = completedChapters.filter(ch => ch > 38 && ch <= 108).length;

    const isWealthLocked = aramCompletions < 5 && kingdoms[0]?.nodes[0]?.chapter_number === 1; // Require 5 Aram nodes to unlock Porul
    const isLoveLocked = isWealthLocked || porulCompletions < 10; // Require 10 Porul nodes to unlock Inbam

    return (
        <div className="min-h-screen bg-[#f3eacb] overflow-hidden relative font-sans">
            {/* Map Background Decor */}
            <div
                className="fixed inset-0 opacity-40 mix-blend-multiply pointer-events-none bg-cover bg-center"
                style={{ backgroundImage: 'url("/quest-map-bg.png")' }}
            ></div>
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/30 pointer-events-none"></div>

            <PageHeader
                gradientClass="bg-gradient-to-r from-teal-700 to-indigo-900"
                onLoginClick={() => setShowAuthModal(true)}
                onUpgradeClick={() => setShowPricingModal(true)}
                onBadgesClick={() => setShowBadgeModal(true)}
                isTamil={isTamil}
                toggleLanguage={toggleLanguage}
                onCoinClick={() => setShowBadgeModal(true)}
                streakCount={JSON.parse(localStorage.getItem('thirukural-visited') || '[]').length}
            >
                <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-sm font-bold opacity-80 uppercase tracking-widest">
                        {isTamil ? 'அத்தியாயம் வரைபடம்' : 'Level Map'}
                    </span>
                </div>
            </PageHeader>

            <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
                {kingdoms.map((kingdom, kIndex) => {
                    const theme = getKingdomTheme(kingdom.name_en);
                    let isLocked = false;
                    if (kIndex === 1) isLocked = isWealthLocked;
                    if (kIndex === 2) isLocked = isLoveLocked;

                    return (
                        <div key={kingdom.id} className={`mb-20 last:mb-10 relative ${isLocked ? 'opacity-70 grayscale' : ''}`}>

                            {/* Kingdom Flag / Header */}
                            <div className="flex items-center justify-center mb-10 sticky top-4 z-30">
                                <div className={`bg-white shadow-2xl rounded-2xl px-8 py-4 border-4 ${theme.border} transform rotate-[-2deg] flex items-center gap-4`}>
                                    <span className="text-4xl drop-shadow-md">{theme.icon}</span>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-800 tracking-wider">
                                            {isTamil ? kingdom.name_ta : kingdom.name_en.toUpperCase()}
                                        </h2>
                                        <p className="text-sm font-bold text-gray-500">
                                            {isLocked ? (isTamil ? 'பூட்டப்பட்டுள்ளது 🔒' : 'LOCKED 🔒') : (isTamil ? 'திறக்கப்பட்டது 🔓' : 'UNLOCKED 🔓')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Snake Route Nodes */}
                            <div className="relative py-10">
                                <div className="flex flex-wrap justify-center gap-x-12 gap-y-16 max-w-4xl mx-auto">
                                    {kingdom.nodes.map((node, index) => {
                                        const isCompleted = completedChapters.includes(node.chapter_number);
                                        // Determine zigzag offset
                                        const row = Math.floor(index / 5);
                                        const isEvenRow = row % 2 === 0;
                                        const translateClass = isEvenRow ? 'translate-y-4' : '-translate-y-4';

                                        return (
                                            <div
                                                key={node.chapter_number}
                                                onClick={() => handleNodeClick(node, isLocked)}
                                                className={`relative group cursor-pointer transition-all duration-300 hover:scale-125 ${translateClass}`}
                                            >
                                                {/* Node Line Connector (visual flair - simplified to dots) */}
                                                {index < kingdom.nodes.length - 1 && (
                                                    <div className="hidden sm:block absolute top-1/2 left-[100%] w-12 border-t-4 border-dashed border-white/50 z-0"></div>
                                                )}

                                                {/* The Map Marker */}
                                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-[0_8px_0_rgba(0,0,0,0.15)] flex flex-col items-center justify-center relative z-10
                                  ${isCompleted ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 border-yellow-600' : 'bg-gradient-to-b from-white to-gray-200 border-gray-400'}
                                  ${!isLocked && !isCompleted ? 'hover:border-blue-500 hover:shadow-[0_8px_0_rgba(59,130,246,0.5)] bg-white active:scale-90' : ''}
                                  ${isLocked ? 'cursor-not-allowed grayscale' : ''}
                                `}>
                                                    {isCompleted && (
                                                        <div className="absolute -top-3 -right-3 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                        </div>
                                                    )}
                                                    <span className={`text-xl font-bold ${isCompleted ? 'text-yellow-900' : 'text-gray-600'}`}>
                                                        {node.chapter_number}
                                                    </span>
                                                </div>

                                                {/* Hover Tooltip / Label */}
                                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max max-w-[150px] text-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none z-20">
                                                    {isTamil ? node.chapter_ta : node.chapter_en}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                        </div>
                    )
                })}
            </main>

            <BadgeModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                language={isTamil ? 'tamil' : 'english'}
                celebrationType={null}
            />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                isTamil={isTamil}
            />

            <PricingModal
                isOpen={showPricingModal}
                onClose={() => setShowPricingModal(false)}
                isTamil={isTamil}
            />
        </div>
    );
}
