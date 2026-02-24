'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);
    }, []);

    useEffect(() => {
        if (!isLoading && (!user || (user.role !== 'parent' && user.role !== 'super_admin'))) {
            // If they have children assigned, they might still be a parent even if role isn't set
            // but for now let's be strict for RBAC testing
            router.push('/');
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
        <div className="min-h-screen bg-rose-50/20 flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-rose-500 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-rose-50/30 font-sans pb-20">
            {/* Nav Header */}
            <div className="bg-white border-b border-rose-100 px-4 py-4 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-2xl transition-transform hover:scale-110">🏠</Link>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">{isTamil ? 'பெற்றோர் தளம்' : 'Parent Dashboard'}</h1>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-10">
                <div className="mb-10">
                    <h2 className="text-4xl font-black text-rose-900 mb-2">{isTamil ? 'உங்கள் குழந்தைகள்' : 'My Children'} 👨‍👩‍👧‍👦</h2>
                    <p className="text-slate-500 font-bold opacity-80">{isTamil ? 'உங்கள் குழந்தைகளின் முன்னேற்றத்தைக் கண்காணியுங்கள்' : 'Track your children\'s learning journey through the Thirukkural.'}</p>
                </div>

                {children.length === 0 ? (
                    <div className="bg-white p-20 rounded-[2.5rem] shadow-xl border border-rose-100 text-center">
                        <div className="text-7xl mb-6">🐣</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">No children linked</h3>
                        <p className="text-slate-400 font-bold mb-8 transition-opacity">Contact your school administrator to link your child's account to your email.</p>
                        <button className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-rose-100">Add Child Manually</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {children.map(child => {
                            const progressPercent = Math.round((child.progress.completedChapters.length / 133) * 100);
                            return (
                                <div key={child.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-white hover:border-rose-200 transition-all group overflow-hidden relative">
                                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                        <div className="h-24 w-24 bg-slate-100 rounded-3xl flex items-center justify-center text-5xl overflow-hidden shadow-inner border-4 border-slate-50">
                                            {child.picture ? <img src={child.picture} alt="" className="w-full h-full object-cover" /> : '🧒'}
                                        </div>
                                        <div className="flex-grow text-center md:text-left">
                                            <h3 className="text-2xl font-black text-slate-800 group-hover:text-rose-600 transition-colors uppercase tracking-tight">{child.name}</h3>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                                                <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full border border-rose-100 uppercase tracking-widest">{child.school?.name || 'Home Learner'}</span>
                                                <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest flex items-center gap-1">🪙 {child.coins} Coins</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Completed</div>
                                            <div className="text-4xl font-black text-rose-700">{child.progress.completedChapters.length} <span className="text-sm text-slate-400">/ 133</span></div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-50">
                                        <div className="flex items-center justify-between mb-3 text-sm font-black uppercase tracking-widest text-slate-400 px-1">
                                            <span>Mastery Progress</span>
                                            <span className="text-rose-600">{progressPercent}%</span>
                                        </div>
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
                                                style={{ width: `${progressPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-sm transition-all border border-slate-100">View Report</button>
                                        <button className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black py-4 rounded-2xl text-sm transition-all border border-rose-100">Weekly Achievement</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-12 p-8 bg-indigo-900 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 opacity-10 text-[180px] pointer-events-none transform translate-x-12 -translate-y-8 transition-transform duration-1000 group-hover:rotate-12">📱</div>
                    <h4 className="text-xl font-black mb-4 flex items-center gap-3">
                        <span className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-xl border border-white/10 shadow-xl">💬</span>
                        WhatsApp Reports
                    </h4>
                    <p className="text-indigo-200 font-medium text-sm leading-relaxed mb-8 max-w-lg opacity-80">
                        Receive automated weekly reports about your child's Tamil learning progress directly on your phone. See which Kurals they've mastered and their current vocabulary score.
                    </p>
                    <button className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-50 transition-all active:scale-95">Enable WhatsApp Updates</button>
                </div>
            </main>
        </div>
    );
}
