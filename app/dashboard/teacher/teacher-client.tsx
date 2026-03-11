'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';
import CreateClassModal from '@/components/create-class-modal';
import InviteLinkModal from '@/components/invite-link-modal';

interface Student {
    id: string;
    name: string;
    email: string;
    picture: string | null;
    classroomId: string;
    progress: {
        completedChapters: number[];
        coins: number;
        streak: number;
        badges: number;
        region: string;
    };
}

interface Classroom {
    id: string;
    name: string;
}

interface DashboardData {
    schoolName: string | null;
    classrooms: Classroom[];
    students: Student[];
}

export default function TeacherDashboardClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    // New Modal States
    const [showCreateClassModal, setShowCreateClassModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [inviteClassName, setInviteClassName] = useState('');

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


    const generateInvite = async (classroomId?: string, className?: string) => {
        if (!user?.schoolId) return;

        try {
            const res = await fetch('/api/schools/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schoolId: user.schoolId,
                    classroomId: classroomId || null,
                    role: 'student'
                })
            });

            if (res.ok) {
                const invite = await res.json();
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                setInviteLink(`${origin}/join/${invite.code}`);
                setInviteCode(invite.code);
                setInviteClassName(className || '');
                setShowInviteModal(true);
            }
        } catch (error) {
            console.error('Failed to generate invite', error);
        }
    };

    useEffect(() => {
        const isAdminEmail = user?.email?.toLowerCase() === 'anu.ganesan@gmail.com';
        if (!isLoading && (!user || (user.role !== 'teacher' && user.role !== 'school_admin' && user.role !== 'super_admin' && !isAdminEmail))) {
            router.push('/');
            return;
        }

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('create') === 'true') {
                setShowCreateClassModal(true);
                router.replace('/dashboard/teacher', { scroll: false });
            }
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

            <CreateClassModal
                isOpen={showCreateClassModal}
                onClose={() => setShowCreateClassModal(false)}
                isTamil={isTamil}
                onSuccess={(newClassroom) => {
                    if (data) {
                        setData({
                            ...data,
                            classrooms: [...data.classrooms, newClassroom]
                        });
                    }
                    setShowCreateClassModal(false);
                    // generate invite link immediately after creating a class
                    generateInvite(newClassroom.id, newClassroom.name);
                }}
            />

            <InviteLinkModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                inviteLink={inviteLink}
                inviteCode={inviteCode}
                classroomName={inviteClassName}
                isTamil={isTamil}
            />

            <main className="max-w-6xl mx-auto px-4 py-10">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-2 tracking-tight">{isTamil ? 'வகுப்பறை மேடை' : 'Classroom Hub'} ⚡️</h2>
                    {data.schoolName && (
                        <p className="text-indigo-600 font-black text-lg sm:text-xl uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                            <span className="text-2xl">🏛️</span> {data.schoolName}
                        </p>
                    )}
                    <p className="text-gray-500 text-sm sm:text-base font-medium">{isTamil ? 'உங்கள் மாணவர்களின் முன்னேற்றத்தை நிகழ்நேரத்தில் கண்காணியுங்கள்.' : 'Track your students\' real-time progress through the Thirukkural.'}</p>
                </div>

                {/* Stats Overview Card */}
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-purple-100 mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 opacity-[0.03] text-[200px] pointer-events-none transform translate-x-12 -translate-y-8 transition-transform group-hover:rotate-6 duration-700">🎓</div>
                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                        <div className="text-center md:text-left">
                            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{isTamil ? 'வகுப்பு சுருக்கம்' : 'Classroom Summary'}</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                <span className="bg-purple-100 text-purple-700 text-xs font-black px-4 py-1.5 rounded-full border border-purple-200 uppercase tracking-widest">{data.students.length} {isTamil ? 'மாணவர்கள்' : 'Students'}</span>
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-4 py-1.5 rounded-full border border-indigo-200 uppercase tracking-widest">{data.classrooms.length} {isTamil ? 'வகுப்புகள்' : 'Classrooms'}</span>
                            </div>
                        </div>
                        <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-100 text-center">
                                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Avg Mastered</div>
                                <div className="text-2xl font-black text-purple-600">
                                    {data.students.length > 0 ? Math.round(data.students.reduce((acc, s) => acc + s.progress.completedChapters.length, 0) / data.students.length) : 0}
                                </div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-100 text-center">
                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Avg Coins</div>
                                <div className="text-2xl font-black text-indigo-600">
                                    {data.students.length > 0 ? Math.round(data.students.reduce((acc, s) => acc + s.progress.coins, 0) / data.students.length) : 0}
                                </div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-100 text-center">
                                <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Best Streak</div>
                                <div className="text-2xl font-black text-orange-600">
                                    {data.students.length > 0 ? Math.max(...data.students.map(s => s.progress.streak)) : 0}
                                </div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-100 text-center">
                                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Top Region</div>
                                <div className="text-sm font-black text-emerald-600 truncate mt-1">
                                    {data.students.length > 0 ? data.students[0].progress.region : 'Global'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex-wrap gap-1">
                        <button
                            onClick={() => setSelectedClassId('all')}
                            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest flex-1 sm:flex-none ${selectedClassId === 'all' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700 border border-transparent'}`}
                        >
                            {isTamil ? 'அனைத்தும்' : 'All Classes'}
                        </button>
                        {data.classrooms.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedClassId(c.id)}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest flex-1 sm:flex-none ${selectedClassId === c.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700 border border-transparent'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Students Master Table */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                    {filteredStudents.length === 0 ? (
                        <div className="p-16 sm:p-24 text-center">
                            <div className="text-7xl mb-6 opacity-80">🏝️</div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No students discovered</h3>
                            <p className="text-gray-500 max-w-sm mx-auto font-medium">Share your classroom invite code or link to begin tracking student progress in real-time.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{isTamil ? 'மாணவர்' : 'Champion'}</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{isTamil ? 'புள்ளிவிவரம்' : 'Stats'}</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{isTamil ? 'தேர்ச்சி' : 'Mastery Progress'}</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{isTamil ? 'நிலை' : 'Status'}</th>
                                        <th className="px-8 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredStudents.map(student => {
                                        const totalKurals = 1330;
                                        const masteredCount = student.progress.completedChapters.length;
                                        const progressPercent = Math.min(100, Math.round((masteredCount / totalKurals) * 100));
                                        const classroomName = data.classrooms.find(c => c.id === student.classroomId)?.name || 'General';

                                        return (
                                            <tr key={student.id} className="hover:bg-purple-50/30 transition-all group duration-300">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl overflow-hidden shadow-inner flex-shrink-0 border-2 border-purple-100 group-hover:scale-110 transition-transform relative">
                                                            {student.picture ? <img src={student.picture} alt="" className="w-full h-full object-cover scale-110 mt-2" /> : '🧒'}
                                                            {student.progress.streak > 0 && (
                                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-orange-100">
                                                                    <span className="text-[10px] font-black text-orange-600">🔥{student.progress.streak}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-gray-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight text-sm">{student.name}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">{classroomName}</span>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{student.progress.region}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 flex items-center gap-1 min-w-[65px]">🪙 {student.progress.coins}</span>
                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 flex items-center gap-1 min-w-[65px]">🏆 {student.progress.badges} Badges</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="w-48 sm:w-64">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{masteredCount} <span className="text-[8px] opacity-70">/ 1330</span></span>
                                                            <span className="text-[10px] font-black text-purple-600">{progressPercent}%</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-400 via-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${progressPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        {progressPercent >= 90 ? (
                                                            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{isTamil ? 'முடிந்தது' : 'Master'}</span>
                                                            </div>
                                                        ) : progressPercent > 0 ? (
                                                            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                                                                <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{isTamil ? 'கற்கிறார்' : 'Learning'}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                                                <span className="h-1.5 w-1.5 bg-gray-300 rounded-full"></span>
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isTamil ? 'தொடங்கவில்லை' : 'Pending'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button className="h-8 w-8 hover:bg-white rounded-lg border border-transparent hover:border-purple-100 hover:shadow-sm text-purple-600 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>


            </main>
        </div>
    );
}
