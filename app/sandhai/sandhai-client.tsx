'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';
import PricingModal from '@/components/pricing-modal';
import PageHeader from '@/components/page-header';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';
import Image from 'next/image';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface AvatarItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string;
    type: 'static' | 'lottie';
    metadata: {
        idle: string;
        happy: string;
        excited: string;
        sad: string;
        thinking: string;
    } | null;
    isPremiumOnly: boolean;
}

export default function SandhaiClient() {
    const { user, refetch } = useAuth();
    const [avatars, setAvars] = useState<AvatarItem[]>([]);
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [coins, setCoins] = useState(0);
    const [activeAvatar, setActiveAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [isTamil, setIsTamil] = useState(false);

    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [confirmBuy, setConfirmBuy] = useState<AvatarItem | null>(null);
    const [hoveredAvatarId, setHoveredAvatarId] = useState<string | null>(null);

    useEffect(() => {
        const handler = (e: Event) => setIsTamil((e as CustomEvent<{ isTamil: boolean }>).detail.isTamil);
        window.addEventListener('tamillanguagechange', handler);
        return () => window.removeEventListener('tamillanguagechange', handler);
    }, []);

    const toggleLanguage = () => {
        const next = !isTamil;
        setIsTamil(next);
        localStorage.setItem('thirukural-language', next ? 'tamil' : 'english');
        window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: next } }));
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const sandhaiRes = await fetch('/api/sandhai');
                const sandhaiData = await sandhaiRes.json();
                setAvars(sandhaiData.catalog || []);
                setUnlockedIds(sandhaiData.unlocked || ['default']);

                if (user) {
                    const [coinsData, avatarData] = await Promise.all([
                        fetch('/api/user/coins').then(res => res.json()),
                        fetch('/api/user/avatar').then(res => res.json())
                    ]);
                    setCoins(coinsData.coins || 0);
                    setActiveAvatar(avatarData.activeAvatarId || 'default');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    const handleBuy = async (avatar: AvatarItem) => {
        if (!user) return;
        if (coins < avatar.price) {
            alert(isTamil ? 'போதுமான நாணயங்கள் இல்லை!' : 'Not enough coins!');
            return;
        }
        // Show confirmation with 30-day warning before deducting coins
        setConfirmBuy(avatar);
    };

    const confirmPurchase = async () => {
        const avatar = confirmBuy;
        if (!avatar || !user) return;
        setConfirmBuy(null);

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
                if (refetch) refetch();
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
            <PageHeader
                title={isTamil ? 'திருக்குறள் சந்தை' : 'Thirukkural Sandhai'}
                gradientClass="bg-gradient-to-r from-purple-800 to-indigo-900"
                onLoginClick={() => setShowAuthModal(true)}
                onUpgradeClick={() => setShowPricingModal(true)}
                onBadgesClick={() => setShowBadgeModal(true)}
                isTamil={isTamil}
                toggleLanguage={toggleLanguage}
                coinCount={coins}
                showCoinOnRight={true}
                onCoinClick={() => setShowBadgeModal(true)}
            >
                <div className="h-2"></div>
            </PageHeader>

            {user?.tier === 'free' && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl animate-bounce">✨</span>
                            <p className="text-sm font-bold">
                                {isTamil
                                    ? 'நாணயம் சேர்த்து வாங்குங்கள் அல்லது பிரீமியத்திற்கு மேம்படுத்தி உடனடியாகப் பெறுங்கள்!'
                                    : 'Save up coins to buy or Upgrade to Premium to unlock legendary avatars instantly!'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowPricingModal(true)}
                            className="bg-white text-purple-600 px-6 py-1.5 rounded-full font-bold text-sm hover:scale-105 transition active:scale-95 shadow-md flex items-center gap-2"
                        >
                            {isTamil ? 'மேம்படுத்து' : 'Upgrade Now'}
                            <span className="text-lg">🚀</span>
                        </button>
                    </div>
                </div>
            )}

            <main className="max-w-4xl mx-auto px-4 py-8">
                {!user ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">{isTamil ? 'உள்நுழையவும்' : 'Please log in to use the Sandhai'}</h2>
                    </div>
                ) : loading ? (
                    <div className="text-center py-20 animate-pulse text-orange-500">Loading shop...</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">

                        {avatars.map(avatar => {
                            const isPaidUser = user?.tier === 'paid';
                            const unlocked = unlockedIds.includes(avatar.id) || isPaidUser;
                            const isActive = activeAvatar === avatar.id;
                            const isLottie = avatar.type === 'lottie';
                            const showPrice = !unlocked && !isPaidUser;

                            return (
                                <div
                                    key={avatar.id}
                                    className={`bg-white rounded-2xl p-4 shadow-sm border-2 text-center flex flex-col items-center gap-3 ${isActive ? 'border-orange-500' : 'border-transparent'} relative`}
                                    onMouseEnter={() => setHoveredAvatarId(avatar.id)}
                                    onMouseLeave={() => setHoveredAvatarId(null)}
                                >
                                    {avatar.isPremiumOnly && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-20">
                                            PREMIUM
                                        </div>
                                    )}
                                    <div className="w-24 h-24 overflow-hidden rounded-full group">
                                        {isLottie ? (
                                            <div className="group-hover:scale-110 transition-transform duration-300">
                                                <div className="w-24 h-24 relative bg-white/50 backdrop-blur-sm rounded-full border-2 border-orange-200 flex items-center justify-center overflow-hidden">
                                                    {hoveredAvatarId === avatar.id || isActive ? (
                                                        <DotLottieReact
                                                            src={avatar.metadata?.idle || ''}
                                                            loop
                                                            autoplay
                                                            style={{ width: '100%', height: '100%' }}
                                                        />
                                                    ) : (
                                                        avatar.imageUrl?.startsWith('/') || avatar.imageUrl?.startsWith('http') ? (
                                                            <Image
                                                                src={avatar.imageUrl}
                                                                alt={avatar.name}
                                                                fill
                                                                className="object-cover opacity-80"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-6xl opacity-80">
                                                                {avatar.imageUrl}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-6xl group-hover:bounce transition-all">{avatar.imageUrl}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{avatar.name}</h3>
                                        {showPrice && (
                                            <>
                                                <p className="text-sm font-semibold text-orange-600">🪙 {avatar.price}</p>
                                                <p className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                    ⏳ {isTamil ? '30 நாள் அணுகல்' : '30-day access'}
                                                </p>
                                            </>
                                        )}
                                        {isPaidUser && !unlockedIds.includes(avatar.id) && avatar.id !== 'default' && (
                                            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-tight">Free with Premium</p>
                                        )}
                                    </div>

                                    <div className="mt-auto w-full pt-2">
                                        {isActive ? (
                                            <span className="inline-block w-full text-center text-orange-500 font-bold text-sm bg-orange-100 px-3 py-2 rounded-xl uppercase tracking-wider">
                                                {isTamil ? 'பயன்பாட்டில்' : 'Active'}
                                            </span>
                                        ) : unlocked ? (
                                            <button
                                                onClick={() => handleEquip(avatar.id)}
                                                className={`w-full font-bold py-2 px-4 rounded-xl transition ${avatar.isPremiumOnly
                                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                                    }`}
                                            >
                                                {isTamil ? 'பயன்படுத்து' : 'Use'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBuy(avatar)}
                                                className={`w-full active:scale-95 text-white font-bold py-2 px-4 rounded-xl transition shadow-sm ${avatar.isPremiumOnly
                                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90'
                                                    : 'bg-orange-500 hover:bg-orange-600'
                                                    }`}
                                            >
                                                {isTamil ? 'பெறுக' : 'Unlock'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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

            <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} isTamil={isTamil} />

            {/* 30-day coin purchase confirmation modal */}
            {confirmBuy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-400 to-amber-500 px-6 py-5 text-center">
                            <div className="text-5xl mb-2">🪙</div>
                            <h2 className="text-white font-black text-xl">
                                {isTamil ? 'நாணயத்தால் வாங்குகிறீர்களா?' : 'Buy with Coins?'}
                            </h2>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 text-center space-y-4">
                            <p className="text-gray-800 font-bold text-lg">{confirmBuy.name}</p>

                            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 text-left">
                                <p className="text-amber-800 font-bold text-sm flex items-center gap-2">
                                    ⏳ {isTamil ? '30 நாள் அணுகல் மட்டுமே!' : '30-Day Access Only!'}
                                </p>
                                <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                                    {isTamil
                                        ? 'நாணயத்தால் வாங்கினால், இந்த அவதார் 30 நாட்களுக்கு மட்டுமே கிடைக்கும். பிறகு மீண்டும் வாங்க வேண்டும்.'
                                        : 'Buying with coins gives you access for 30 days only. After that, you\'ll need to buy again.'}
                                </p>
                                <p className="text-purple-700 text-xs mt-2 font-semibold">
                                    ✨ {isTamil ? 'பிரீமியத்திற்கு மேம்படுத்தினால் நிரந்தரமாகப் பெறலாம்!' : 'Upgrade to Premium for permanent access!'}
                                </p>
                            </div>

                            <p className="text-gray-600 text-sm">
                                {isTamil
                                    ? `🪙 ${confirmBuy.price} நாணயங்கள் பயன்படுத்தப்படும். உங்களிடம் ${coins} உள்ளது.`
                                    : `🪙 ${confirmBuy.price} coins will be deducted. You have ${coins} coins.`}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => setConfirmBuy(null)}
                                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
                            >
                                {isTamil ? 'ரத்து' : 'Cancel'}
                            </button>
                            <button
                                onClick={confirmPurchase}
                                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black shadow-lg hover:opacity-90 transition active:scale-95"
                            >
                                {isTamil ? 'வாங்கு' : 'Buy Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
