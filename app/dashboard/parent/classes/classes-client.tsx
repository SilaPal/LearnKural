'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';
import AuthModal from '@/components/auth-modal';

interface Enrollment {
    id: string;
    classroomId: string;
    classroomName: string;
    schoolName: string;
    schoolLogo: string | null;
    status: 'active' | 'completed' | 'transferred' | 'dropped';
    joinedAt: string;
    childProfileId: string | null;
    endDate: string | null;
    teacherName: string | null;
}

interface Profile {
    id: string;
    nickname: string;
}

export default function ParentClassesClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'active' | 'completed'>('active');
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

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
        if (!isLoading && (!user || (user.role !== 'parent' && user.role !== 'super_admin' && user.role !== 'school_admin' && user.role !== 'teacher' && user.role !== 'student'))) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/parent/classes');
                if (res.ok) {
                    const data = await res.json();
                    setEnrollments(data.enrollments || []);
                    setProfiles(data.profiles || []);
                } else {
                    setError('Failed to load class data');
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

    const filtered = enrollments.filter(e => {
        if (tab === 'active') return e.status === 'active';
        return e.status === 'completed';
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20 relative">
            <PageHeader
                gradientClass="bg-gradient-to-r from-indigo-700 to-purple-800"
                onLoginClick={() => setShowAuthModal(true)}
                onUpgradeClick={() => setShowPricingModal(true)}
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

            <main className="max-w-4xl mx-auto px-4 py-10">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">
                        {isTamil ? 'வகுப்புகள்' : 'My Classes'} 🏛️
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base">
                        {isTamil ? 'உங்கள் குழந்தைகளின் வகுப்பு சேர்க்கைகளைக் கண்காணியுங்கள்.' : 'Track classroom enrollments for your learning profiles.'}
                    </p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-sm mx-auto">
                    <button
                        onClick={() => setTab('active')}
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${tab === 'active' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                        {isTamil ? 'தற்போதைய' : 'Active'}
                    </button>
                    <button
                        onClick={() => setTab('completed')}
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${tab === 'completed' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                        {isTamil ? 'முடிந்தவை' : 'Completed'}
                    </button>
                </div>

                {filtered.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-gray-100">
                        <div className="text-6xl mb-6">🍃</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {isTamil ? 'வகுப்புகள் எதுவும் இல்லை' : 'No classes found'}
                        </h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                            {tab === 'active'
                                ? (isTamil ? 'வகுப்பில் சேர அழைப்பு குறியீட்டைப் பயன்படுத்தவும்.' : 'Use an invite code to join a classroom.')
                                : (isTamil ? 'இன்னும் எந்த வகுப்பும் நிறைவடையவில்லை.' : 'No classrooms have been completed yet.')}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filtered.map(enrollment => {
                            const profileName = profiles.find(p => p.id === enrollment.childProfileId)?.nickname || user?.name || 'Self';
                            return (
                                <div key={enrollment.id} className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all group overflow-hidden relative">
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-4xl overflow-hidden shadow-inner border border-indigo-100 shrink-0">
                                            {enrollment.schoolLogo ? (
                                                <img src={enrollment.schoolLogo} alt="" className="w-full h-full object-contain p-2" />
                                            ) : '🏫'}
                                        </div>
                                        <div className="flex-grow text-center sm:text-left">
                                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                                <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                    {enrollment.classroomName}
                                                </h3>
                                                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-emerald-200">
                                                    {enrollment.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 font-bold text-sm mb-3">
                                                {enrollment.schoolName}
                                            </p>
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                                                <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-100 uppercase tracking-widest flex items-center gap-1">
                                                    👤 {profileName}
                                                </span>
                                                {enrollment.teacherName && (
                                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest flex items-center gap-1">
                                                        👨‍🏫 Teacher: {enrollment.teacherName}
                                                    </span>
                                                )}
                                                {enrollment.endDate && (
                                                    <span className="bg-gray-50 text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full border border-gray-200 uppercase tracking-widest flex items-center gap-1">
                                                        🏁 Ends: {new Date(enrollment.endDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
