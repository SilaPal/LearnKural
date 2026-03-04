'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';

interface Student {
    id: string;
    name: string;
    email: string;
    picture: string | null;
    classroomId: string;
    progress: {
        completedChapters: number[];
    };
}

interface Classroom {
    id: string;
    name: string;
}

export default function TeacherDashboardClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);
    const [data, setData] = useState<{ classrooms: Classroom[], students: Student[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
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
        if (!isLoading && (!user || (user.role !== 'teacher' && user.role !== 'school_admin'))) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/teacher');
                if (res.ok) {
                    setData(await res.json());
                } else {
                    setError('Failed to load dashboard');
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

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md mx-auto border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">{error}</h2>
                <Link href="/" className="mt-6 inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold">Back Home</Link>
            </div>
        </div>
    );

    if (!data) return null;

    const filteredStudents = selectedClassId === 'all'
        ? data.students
        : data.students.filter(s => s.classroomId === selectedClassId);

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
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 bg-[length:200%_auto] animate-gradient"></div>

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
                                ? 'ஆசிரியர் பகுதி தற்போது உருவாக்கப்பட்டு வருகிறது. விரைவில் பயன்பாட்டுக்கு வரும்!'
                                : 'The Teacher Dashboard is currently under construction. Stay tuned for the official launch!')
                            : (isTamil
                                ? 'ஆசிரியர் பகுதியைப் பயன்படுத்த பிரீமியம் சந்தா தேவை. உங்கள் திட்டத்தை மேம்படுத்தவும்.'
                                : 'The Teacher Dashboard is a premium feature. Please upgrade your plan to access this portal.')}
                    </p>

                    {!isPaid ? (
                        <button
                            onClick={() => setShowPricingModal(true)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 text-lg"
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

            <main className="max-w-6xl mx-auto px-4 py-10">
                {/* Stats Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">{isTamil ? 'உங்கள் மாணவர்கள்' : 'Classroom Mastery'} 🎓</h2>
                        <p className="text-gray-500 font-medium">Monitoring {data.students.length} students across {data.classrooms.length} classes.</p>
                    </div>

                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex-wrap gap-1">
                        <button
                            onClick={() => setSelectedClassId('all')}
                            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest flex-1 sm:flex-none ${selectedClassId === 'all' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700 border border-transparent'}`}
                        >
                            {isTamil ? 'அனைத்தும்' : 'All Classes'}
                        </button>
                        {data.classrooms.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedClassId(c.id)}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest flex-1 sm:flex-none ${selectedClassId === c.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700 border border-transparent'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Students Table/Grid */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {filteredStudents.length === 0 ? (
                        <div className="p-16 sm:p-24 text-center">
                            <div className="text-7xl mb-6 opacity-80">🏝️</div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No students yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">Share your classroom invite code or link to begin tracking student progress in real-time.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 sm:px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-500">{isTamil ? 'மாணவர்' : 'Student'}</th>
                                        <th className="px-6 sm:px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-500">{isTamil ? 'வகுப்பு' : 'Class'}</th>
                                        <th className="px-6 sm:px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-500">{isTamil ? 'தேர்ச்சி' : 'Mastery Progress'}</th>
                                        <th className="px-6 sm:px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-500">{isTamil ? 'நிலை' : 'Status'}</th>
                                        <th className="px-6 sm:px-8 py-5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredStudents.map(student => {
                                        const progressPercent = Math.min(100, Math.round((student.progress.completedChapters.length / 133) * 100));
                                        const classroomName = data.classrooms.find(c => c.id === student.classroomId)?.name || 'General';

                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50/80 transition-all group duration-200">
                                                <td className="px-6 sm:px-8 py-4 sm:py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl overflow-hidden shadow-inner flex-shrink-0 border border-purple-100">
                                                            {student.picture ? <img src={student.picture} alt="" className="w-full h-full object-cover" /> : '🧒'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight">{student.name}</div>
                                                            <div className="text-xs text-gray-500 font-medium truncate max-w-[120px] sm:max-w-none">{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 sm:px-8 py-4 sm:py-5">
                                                    <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-100 uppercase tracking-widest whitespace-nowrap">{classroomName}</span>
                                                </td>
                                                <td className="px-6 sm:px-8 py-4 sm:py-5">
                                                    <div className="w-32 sm:w-48">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{student.progress.completedChapters.length} / 133</span>
                                                            <span className="text-[10px] sm:text-xs font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">{progressPercent}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${progressPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 sm:px-8 py-4 sm:py-5">
                                                    <div className="flex items-center gap-1.5">
                                                        {progressPercent === 100 ? (
                                                            <><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span><span className="text-[10px] sm:text-xs font-bold text-emerald-600">Completed</span></>
                                                        ) : progressPercent > 0 ? (
                                                            <><span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse"></span><span className="text-[10px] sm:text-xs font-bold text-amber-600">Learning</span></>
                                                        ) : (
                                                            <><span className="h-1.5 w-1.5 bg-gray-300 rounded-full"></span><span className="text-[10px] sm:text-xs font-bold text-gray-400">Not Started</span></>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 sm:px-8 py-4 sm:py-5 text-right">
                                                    <button className="text-indigo-600 font-black hover:underline text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">View Stats →</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <section className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 opacity-[0.03] text-[180px] pointer-events-none transform translate-x-12 -translate-y-8 group-hover:rotate-12 transition-transform duration-700">🎫</div>
                        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-4">
                            <span className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🎟️</span>
                            Add More Champions
                        </h3>
                        <p className="text-slate-500 font-bold opacity-80 mb-10 leading-relaxed text-sm">
                            Ready to expand your class? Share the global academy code or generate classroom-specific links to bring your students onto the platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="flex-1 bg-indigo-600 text-white font-black py-4.5 px-6 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-sm">Copy Student Invite</button>
                            <button className="flex-1 bg-slate-50 text-slate-700 font-black py-4.5 px-6 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 text-sm">Classroom Setup</button>
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
                        <div className="absolute top-0 right-0 opacity-10 text-[180px] pointer-events-none transform translate-x-12 -translate-y-8 group-hover:scale-110 transition-all duration-1000">📊</div>
                        <h3 className="text-2xl font-black mb-6 flex items-center gap-4 relative z-10">
                            <span className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl border border-white/10 shadow-xl">📈</span>
                            Parent Engagement
                        </h3>
                        <p className="text-indigo-100 font-bold opacity-70 mb-10 leading-relaxed text-sm relative z-10">
                            Automated progress reports will be sent to parents every Sunday. Ensure parent emails are linked to students for maximum engagement.
                        </p>
                        <button className="bg-white/10 hover:bg-white/20 text-white font-black py-4.5 px-8 rounded-2xl transition-all border border-white/10 w-full relative z-10 text-sm shadow-xl backdrop-blur-sm">View Parent Reports</button>
                    </section>
                </div>
            </main>
        </div>
    );
}
