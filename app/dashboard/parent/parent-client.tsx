'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';

interface LearningProfile {
    id: string;
    nickname: string;
    activeAvatarId: string;
    avatarThumbnail: string | null;
    coins: number;
    streak: number;
    longestStreak: number;
    completedChapters: number[];
    badges: any[];
    region: string;
    isParentAccount?: boolean;
}

interface ParentData extends LearningProfile { }

export default function ParentDashboardClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);
    const [profiles, setProfiles] = useState<LearningProfile[]>([]);
    const [parentData, setParentData] = useState<ParentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [badgeModalProfile, setBadgeModalProfile] = useState<LearningProfile | undefined>(undefined);

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);
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
        if (!isLoading && (!user || (user.role !== 'parent' && user.role !== 'super_admin'))) {
            // If they have children assigned, they might still be a parent even if role isn't set
            // but for now let's be strict for RBAC testing
            router.push('/schools/register');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/parent');
                if (res.ok) {
                    const data = await res.json();
                    setProfiles(data.profiles || []);
                    setParentData(data.parent || null);
                } else {
                    setError('Failed to load profile data');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isLoading, router]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
    );

    const isPaid = user?.tier === 'paid';

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20 relative">
            <PageHeader
                gradientClass="bg-gradient-to-r from-purple-700 to-indigo-700"
                onLoginClick={() => setShowAuthModal(true)}
                onUpgradeClick={() => setShowPricingModal(true)}
                onBadgesClick={() => {
                    setBadgeModalProfile(parentData || undefined);
                    setShowBadgeModal(true);
                }}
                isTamil={isTamil}
                toggleLanguage={toggleLanguage}
            />


            <PricingModal
                isOpen={showPricingModal}
                onClose={() => setShowPricingModal(false)}
                isTamil={isTamil}
            />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                isTamil={isTamil}
            />

            <BadgeModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                language={isTamil ? 'tamil' : 'english'}
                celebrationType={null}
                profileId={badgeModalProfile?.id}
                profileData={badgeModalProfile ? {
                    coins: badgeModalProfile.coins,
                    streak: badgeModalProfile.streak,
                    longestStreak: badgeModalProfile.longestStreak,
                    completedChapters: badgeModalProfile.completedChapters,
                    badges: badgeModalProfile.badges,
                } : undefined}
            />

            <main className="max-w-4xl mx-auto px-4 py-10">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">{isTamil ? 'உங்கள் குழு' : 'My Squad'} ⚡️</h2>
                    <p className="text-gray-500 text-sm sm:text-base">{isTamil ? 'உங்கள் குழுவின் முன்னேற்றத்தைக் கண்காணியுங்கள்.' : 'Track your group\'s learning journey through the Thirukkural.'}</p>
                </div>

                <div className="space-y-6">
                    {/* Render Parent Profile First */}
                    {parentData && (
                        <div key={parentData.id} className="bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-indigo-100 hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 opacity-[0.03] text-[180px] pointer-events-none transform translate-x-12 -translate-y-8">👑</div>
                            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                <div className="h-20 w-20 sm:h-24 sm:w-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl overflow-hidden shadow-inner flex-shrink-0 border-2 border-indigo-200 relative">
                                    {parentData.avatarThumbnail ? (
                                        <img src={parentData.avatarThumbnail} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl">👤</span>
                                    )}
                                    {parentData.streak > 0 && (
                                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-orange-100">
                                            <span className="text-sm font-bold flex items-center gap-0.5 whitespace-nowrap"><span className="text-sm">🔥</span><span className="text-orange-600 mt-0.5">{parentData.streak}</span></span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-indigo-700 transition-colors uppercase tracking-tight">{parentData.nickname}</h3>
                                        <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">You</span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                        <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest flex items-center gap-1">🪙 {parentData.coins} Coins</span>
                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1">🌍 {parentData.region}</span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 mt-4 md:mt-0 bg-white/50 rounded-xl p-4 border border-indigo-100 w-full md:w-auto text-center md:text-right">
                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Kurals Mastered</div>
                                    <div className="text-3xl sm:text-4xl font-black text-indigo-600">{parentData.completedChapters.length} <span className="text-sm text-indigo-300 font-bold">/ 1330</span></div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-indigo-100/50">
                                <div className="flex items-center justify-between mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-400 px-1">
                                    <span>Learning Progress</span>
                                    <span className="text-indigo-600 font-black">{Math.min(100, Math.round((parentData.completedChapters.length / 1330) * 100))}%</span>
                                </div>
                                <div className="h-3 w-full bg-indigo-50 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min(100, Math.round((parentData.completedChapters.length / 1330) * 100))}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <Link
                                    href="/"
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-md text-center">
                                    Back to Learning
                                </Link>
                                <button
                                    onClick={() => {
                                        setBadgeModalProfile(parentData || undefined);
                                        setShowBadgeModal(true);
                                    }}
                                    className="flex-1 bg-white hover:bg-gray-50 text-indigo-600 font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all border border-indigo-200">
                                    View My Report
                                </button>
                            </div>
                        </div>
                    )}

                    {profiles.map(profile => {
                        const progressPercent = Math.min(100, Math.round((profile.completedChapters.length / 1330) * 100));
                        return (
                            <div key={profile.id} className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all group overflow-hidden relative">
                                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                    <div className="h-20 w-20 sm:h-24 sm:w-24 bg-purple-50 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl overflow-hidden shadow-inner flex-shrink-0 border-2 border-purple-100 relative">
                                        {profile.avatarThumbnail ? (
                                            <img src={profile.avatarThumbnail} alt="" className="w-full h-full object-cover scale-110 mt-2" />
                                        ) : (
                                            <span className="text-5xl">🧒</span>
                                        )}
                                        {profile.streak > 0 && (
                                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-orange-100">
                                                <span className="text-sm font-bold flex items-center gap-0.5 whitespace-nowrap"><span className="text-sm">🔥</span><span className="text-orange-600 mt-0.5">{profile.streak}</span></span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow text-center md:text-left">
                                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight">{profile.nickname}</h3>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                            <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest flex items-center gap-1">🪙 {profile.coins} Coins</span>
                                            {profile.badges.length > 0 && (
                                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest flex items-center gap-1">🏆 {profile.badges.length} Badges</span>
                                            )}
                                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1">🌍 {profile.region}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 mt-4 md:mt-0 bg-gray-50 rounded-xl p-4 border border-gray-100 w-full md:w-auto text-center md:text-right">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kurals Mastered</div>
                                        <div className="text-3xl sm:text-4xl font-black text-purple-600">{profile.completedChapters.length} <span className="text-sm text-gray-400 font-bold">/ 1330</span></div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                                        <span>Learning Progress</span>
                                        <span className="text-purple-600 font-black">{progressPercent}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <button
                                        onClick={async () => {
                                            await fetch('/api/auth/switch-profile', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ profileId: profile.id }),
                                            });
                                            window.location.href = '/';
                                        }}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-md">
                                        Play as {profile.nickname}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBadgeModalProfile(profile);
                                            setShowBadgeModal(true);
                                        }}
                                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all border border-gray-200">
                                        View Report
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <div className="mt-6 flex justify-center">
                        <Link href="/profile-select" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-bold text-sm bg-purple-50 hover:bg-purple-100 px-6 py-3 rounded-full transition border border-purple-100 shadow-sm">
                            <span className="text-lg">+</span> Add Another Profile
                        </Link>
                    </div>
                </div>



            </main>
        </div>
    );
}
