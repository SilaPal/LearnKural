'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';

interface Child {
    id: string;
    name: string;
    email: string;
    picture: string | null;
    coins: number;
    activeAvatarId: string;
    school?: {
        name: string;
    };
    progress: {
        completedChapters: number[];
        badges: any[];
    };
}

export default function ParentDashboardClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

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
                    setChildren(data.children || []);
                } else {
                    setError('Failed to load child data');
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
                onBadgesClick={() => setShowBadgeModal(true)}
                isTamil={isTamil}
                toggleLanguage={toggleLanguage}
            />

            {/* Premium Requirement & Coming Soon Overlay */}
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/10 backdrop-blur-md pt-20">
                <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-white max-w-lg w-full text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-gradient"></div>

                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                        {isPaid ? '🚀' : '💎'}
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        {isPaid
                            ? (isTamil ? 'விரைவில் வருகிறது!' : 'Coming Soon!')
                            : (isTamil ? 'பிரீமியம் அனுமதி தேவை' : 'Premium Access Required')}
                    </h2>

                    <p className="text-gray-600 mb-10 leading-relaxed font-medium text-sm sm:text-base">
                        {isPaid
                            ? (isTamil
                                ? 'பெற்றோர் பகுதி தற்போது உருவாக்கப்பட்டு வருகிறது. விரைவில் பயன்பாட்டுக்கு வரும்!'
                                : 'The Parent Dashboard is currently under construction. Stay tuned for the official launch!')
                            : (isTamil
                                ? 'பெற்றோர் பகுதியைப் பயன்படுத்த பிரீமியம் சந்தா தேவை. உங்கள் திட்டத்தை மேம்படுத்தவும்.'
                                : 'The Parent Dashboard is a premium feature. Please upgrade your plan to access this portal.')}
                    </p>

                    {!isPaid ? (
                        <button
                            onClick={() => setShowPricingModal(true)}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-purple-200 transition-all hover:scale-[1.02] active:scale-95 text-lg"
                        >
                            {isTamil ? 'பிரீமியத்திற்கு மாறவும்' : 'Upgrade to Premium'}
                        </button>
                    ) : (
                        <Link
                            href="/"
                            className="w-full inline-block bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-lg"
                        >
                            {isTamil ? 'முகப்புக்குச் செல்க' : 'Back to Home'}
                        </Link>
                    )}

                    {!isPaid && (
                        <Link href="/" className="mt-6 inline-block text-gray-400 hover:text-gray-600 font-bold text-sm underline underline-offset-4 decoration-2">
                            {isTamil ? 'பிறகு பார்க்கலாம்' : 'Maybe Later'}
                        </Link>
                    )}
                </div>
            </div>

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
            />

            <main className="max-w-4xl mx-auto px-4 py-10">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">{isTamil ? 'உங்கள் குழந்தைகள்' : 'My Children'} 👨‍👩‍👧‍👦</h2>
                    <p className="text-gray-500 text-sm sm:text-base">{isTamil ? 'உங்கள் குழந்தைகளின் முன்னேற்றத்தைக் கண்காணியுங்கள்.' : 'Track your children\'s learning journey through the Thirukkural.'}</p>
                </div>

                {children.length === 0 ? (
                    <div className="bg-white p-12 sm:p-20 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
                        <div className="text-7xl mb-6">🐣</div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No children linked</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Contact your school administrator to link your child's account to your email.</p>
                        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity">Add Child Manually</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {children.map(child => {
                            const progressPercent = Math.round((child.progress.completedChapters.length / 133) * 100);
                            return (
                                <div key={child.id} className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all group overflow-hidden relative">
                                    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                        <div className="h-20 w-20 sm:h-24 sm:w-24 bg-purple-50 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl overflow-hidden shadow-inner flex-shrink-0 border-2 border-purple-100">
                                            {child.picture ? <img src={child.picture} alt="" className="w-full h-full object-cover" /> : '🧒'}
                                        </div>
                                        <div className="flex-grow text-center md:text-left">
                                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight">{child.name}</h3>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                                <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-100 uppercase tracking-widest">{child.school?.name || 'Home Learner'}</span>
                                                <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest flex items-center gap-1">🪙 {child.coins} Coins</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 mt-4 md:mt-0 bg-gray-50 rounded-2xl p-4 border border-gray-100 w-full md:w-auto text-center md:text-right">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Completed</div>
                                            <div className="text-3xl sm:text-4xl font-black text-purple-600">{child.progress.completedChapters.length} <span className="text-sm text-gray-400 font-bold">/ 133</span></div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                                            <span>Mastery Progress</span>
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
                                        <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all border border-gray-200">View Report</button>
                                        <button className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all border border-purple-100">Weekly Achievement</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-10 p-6 sm:p-8 bg-gradient-to-br from-purple-800 to-indigo-900 rounded-[2rem] text-white relative overflow-hidden group shadow-lg">
                    <div className="absolute top-0 right-0 opacity-10 text-[180px] pointer-events-none transform translate-x-12 -translate-y-8 transition-transform duration-1000 group-hover:rotate-12">📱</div>
                    <h4 className="text-lg sm:text-xl font-black mb-3 flex items-center gap-3">
                        <span className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10">💬</span>
                        WhatsApp Reports
                    </h4>
                    <p className="text-purple-200 text-sm leading-relaxed mb-6 max-w-lg">
                        Receive automated weekly reports about your child's Tamil learning progress directly on your phone. See which Kurals they've mastered and their current vocabulary score.
                    </p>
                    <button className="w-full sm:w-auto bg-white text-purple-900 px-6 sm:px-8 py-3.5 rounded-xl font-bold shadow hover:bg-gray-50 transition-all active:scale-95 text-sm">Enable WhatsApp Updates</button>
                </div>
            </main>
        </div>
    );
}
