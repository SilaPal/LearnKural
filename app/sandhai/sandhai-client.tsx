'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';
import PricingModal from '@/components/pricing-modal';

interface AvatarItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string;
    isPremiumOnly: boolean;
}

export default function SandhaiClient() {
    const { user } = useAuth();
    const [avatars, setAvars] = useState<AvatarItem[]>([]);
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [coins, setCoins] = useState(0);
    const [activeAvatar, setActiveAvatar] = useState('default');
    const [loading, setLoading] = useState(true);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [isTamil, setIsTamil] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);

        if (user) {
            Promise.all([
                fetch('/api/sandhai').then(res => res.json()),
                fetch('/api/user/coins').then(res => res.json()),
                fetch('/api/user/avatar').then(res => res.json())
            ]).then(([sandhaiData, coinsData, avatarData]) => {
                setAvars(sandhaiData.catalog || []);
                setUnlockedIds(sandhaiData.unlocked || ['default']);
                setCoins(coinsData.coins || 0);
                setActiveAvatar(avatarData.activeAvatarId || 'default');
            }).catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleBuy = async (avatar: AvatarItem) => {
        if (!user) return;
        if (avatar.isPremiumOnly && user.tier === 'free') {
            setShowPricingModal(true);
            return;
        }
        if (coins < avatar.price) {
            alert(isTamil ? 'போதுமான நாணயங்கள் இல்லை!' : 'Not enough coins!');
            return;
        }

        try {
            const res = await fetch('/api/sandhai/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarId: avatar.id })
            });
            const data = await res.json();
            if (data.success) {
                setCoins(data.coinsRemaining);
                setUnlockedIds([...unlockedIds, avatar.id]);
                handleEquip(avatar.id);
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEquip = async (id: string) => {
        if (!user) return;
        try {
            const res = await fetch('/api/user/avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarId: id })
            });
            const data = await res.json();
            if (data.activeAvatarId) {
                setActiveAvatar(data.activeAvatarId);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-orange-50 pb-20">
            <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-6">
                <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-white/20 rounded-full transition">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </Link>
                        <h1 className="text-2xl font-bold">{isTamil ? 'சந்தை (Avatar Shop)' : 'Sandhai (Avatar Shop)'}</h1>
                    </div>
                    <div className="flex gap-4 items-center font-bold bg-white/20 px-4 py-2 rounded-full">
                        <span>🪙 {coins}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {!user ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">{isTamil ? 'உள்நுழையவும்' : 'Please log in to use the Sandhai'}</h2>
                    </div>
                ) : loading ? (
                    <div className="text-center py-20 animate-pulse text-orange-500">Loading shop...</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {/* Hardcoded default avatar block if not in DB yet */}
                        <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 text-center flex flex-col items-center gap-3 ${activeAvatar === 'default' ? 'border-orange-500' : 'border-transparent'}`}>
                            <div className="text-6xl">🧒</div>
                            <h3 className="font-bold text-gray-800">Default</h3>
                            <div className="mt-auto w-full pt-2">
                                {activeAvatar === 'default' ? (
                                    <span className="inline-block w-full text-center text-orange-500 font-bold text-sm bg-orange-100 px-3 py-2 rounded-xl uppercase tracking-wider">{isTamil ? 'பயன்பாட்டில்' : 'Equipped'}</span>
                                ) : (
                                    <button onClick={() => handleEquip('default')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-xl transition">
                                        {isTamil ? 'பயன்படுத்து' : 'Equip'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {avatars.map(avatar => {
                            const unlocked = unlockedIds.includes(avatar.id);
                            const isActive = activeAvatar === avatar.id;

                            return (
                                <div key={avatar.id} className={`bg-white rounded-2xl p-4 shadow-sm border-2 text-center flex flex-col items-center gap-3 ${isActive ? 'border-orange-500' : 'border-transparent'} relative`}>
                                    {avatar.isPremiumOnly && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                            PREMIUM
                                        </div>
                                    )}
                                    <div className="text-6xl">{avatar.imageUrl}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{avatar.name}</h3>
                                        {!unlocked && <p className="text-sm font-semibold text-orange-600">🪙 {avatar.price}</p>}
                                    </div>

                                    <div className="mt-auto w-full pt-2">
                                        {isActive ? (
                                            <span className="inline-block w-full text-center text-orange-500 font-bold text-sm bg-orange-100 px-3 py-2 rounded-xl uppercase tracking-wider">
                                                {isTamil ? 'பயன்பாட்டில்' : 'Equipped'}
                                            </span>
                                        ) : unlocked ? (
                                            <button onClick={() => handleEquip(avatar.id)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-xl transition">
                                                {isTamil ? 'பயன்படுத்து' : 'Equip'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBuy(avatar)}
                                                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-2 px-4 rounded-xl transition shadow-sm"
                                            >
                                                {isTamil ? 'வாங்கு' : 'Buy'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} isTamil={isTamil} />
        </div>
    );
}
