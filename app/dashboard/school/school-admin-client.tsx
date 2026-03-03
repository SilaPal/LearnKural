'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';

interface DashboardData {
    school: {
        id: string;
        name: string;
        logo: string | null;
        banner: string | null;
    };
    stats: {
        students: number;
        classrooms: number;
    };
    classrooms: any[];
    recentUsers: any[];
}

export default function SchoolAdminClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);
        const handler = (e: Event) => setIsTamil((e as CustomEvent<{ isTamil: boolean }>).detail.isTamil);
        window.addEventListener('tamillanguagechange', handler);
        return () => window.removeEventListener('tamillanguagechange', handler);
    }, []);


    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'school_admin')) {
            router.push('/schools/register');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/school');
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

    const handleCreateInvite = async (role: 'student' | 'teacher', classroomId?: string) => {
        setCreatingInvite(true);
        try {
            const res = await fetch('/api/schools/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schoolId: data?.school.id,
                    classroomId,
                    role
                })
            });
            const invite = await res.json();
            setInviteCode(invite.code);
        } catch (err) {
            alert('Failed to create invite');
        } finally {
            setCreatingInvite(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center max-w-md">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800">{error}</h2>
                <Link href="/" className="mt-6 inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold">Back Home</Link>
            </div>
        </div>
    );

    if (!data) return null;

    const isPaid = user?.tier === 'paid';

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
            <PageHeader gradientClass="bg-gradient-to-r from-purple-700 to-indigo-700" />

            {/* Premium Requirement & Coming Soon Overlay */}
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/10 backdrop-blur-md pt-20">
                <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-white max-w-lg w-full text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 bg-[length:200%_auto] animate-gradient"></div>

                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                        {isPaid ? '🚀' : '💎'}
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        {isPaid
                            ? (isTamil ? 'விரைவில் வருகிறது!' : 'Coming Soon!')
                            : (isTamil ? 'பிரீமியம் அனுமதி தேவை' : 'Premium Access Required')}
                    </h2>

                    <p className="text-gray-600 mb-10 leading-relaxed font-medium">
                        {isPaid
                            ? (isTamil
                                ? 'பள்ளி மேடை தற்போது உருவாக்கப்பட்டு வருகிறது. விரைவில் பயன்பாட்டுக்கு வரும்!'
                                : 'The School Portal is currently under construction. Stay tuned for the official launch!')
                            : (isTamil
                                ? 'பள்ளி மேடையைப் பயன்படுத்த பிரீமியம் சந்தா தேவை. உங்கள் திட்டத்தை மேம்படுத்தவும்.'
                                : 'The School Portal is a premium feature. Please upgrade your plan to access this dashboard.')}
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
            {/* Header hero area */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white pt-8 pb-24 px-4 sm:px-8 shadow-inner">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-white/20 shadow-sm">Academy Dashboard</span>
                            <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">Active Subscription</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight">{data.school.name}</h1>
                        <p className="text-purple-200 mt-2 text-sm font-medium">
                            ID: <span className="font-mono bg-white/10 px-1 rounded">{data.school.id}</span> • School Administrator Panel
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/20 shadow-sm text-sm">
                            {isTamil ? 'அமைப்புகள்' : 'Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-purple-600 transition-colors">{isTamil ? 'மாணவர்கள்' : 'Total Students'}</div>
                            <div className="text-3xl sm:text-4xl font-black text-gray-900">{data.stats.students}</div>
                        </div>
                        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-purple-50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner border border-purple-100">👦</div>
                    </div>
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-amber-600 transition-colors">{isTamil ? 'வகுப்பறைகள்' : 'Active Classes'}</div>
                            <div className="text-3xl sm:text-4xl font-black text-gray-900">{data.stats.classrooms}</div>
                        </div>
                        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner border border-amber-100">🏫</div>
                    </div>
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-emerald-600 transition-colors">{isTamil ? 'குறள் தேர்ச்சி' : 'Mastery Score'}</div>
                            <div className="text-3xl sm:text-4xl font-black text-emerald-600">84<span className="text-lg text-gray-400 ml-1 font-bold">%</span></div>
                        </div>
                        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner border border-emerald-100">📈</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Classrooms & Management */}
                    <div className="lg:col-span-2 space-y-10">
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{isTamil ? 'வகுப்பறைகள்' : 'Classrooms'}</h2>
                                <button className="text-purple-600 font-bold hover:underline text-sm">+ {isTamil ? 'புதிய வகுப்பு' : 'Add New Class'}</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.classrooms.length === 0 ? (
                                    <div className="col-span-2 bg-gray-50 border-2 border-dashed border-gray-200 p-12 rounded-3xl text-center text-gray-400 font-bold">
                                        No classrooms created yet.
                                    </div>
                                ) : (
                                    data.classrooms.map(c => (
                                        <div key={c.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-100 transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight">{c.name}</h3>
                                                <div className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1.5 rounded-md uppercase tracking-widest">Standard Plan</div>
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium space-y-2.5 mb-6">
                                                <div className="flex items-center gap-2">👨‍🏫 Teacher: {c.teacherId || 'Not assigned'}</div>
                                                <div className="flex items-center gap-2">👥 Students: 0</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors border border-gray-200">Manage</button>
                                                <button
                                                    onClick={() => handleCreateInvite('student', c.id)}
                                                    className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors border border-purple-100"
                                                >
                                                    Invite
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-6">{isTamil ? 'அண்மைய செயல்பாடுகள்' : 'Recent Joins'}</h2>
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                {data.recentUsers.length === 0 ? (
                                    <div className="p-10 text-center text-gray-400 font-medium">No students joined yet. Use the invite section to bring them in!</div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {data.recentUsers.map(u => (
                                            <div key={u.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl overflow-hidden shadow-inner flex-shrink-0 border border-purple-100">
                                                        {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" /> : '🧒'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors tracking-tight">{u.name}</div>
                                                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 sm:gap-2">
                                                            <span className="truncate max-w-[100px] sm:max-w-none">{u.email}</span>
                                                            <span className="h-1 w-1 bg-gray-300 rounded-full shrink-0"></span>
                                                            <span className="shrink-0">{new Date(u.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Role</div>
                                                    <div className={`text-[9px] sm:text-[10px] px-2.5 sm:px-3 py-1 rounded-md font-bold uppercase tracking-widest border ${u.role === 'teacher' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                        {u.role}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Actions & Invites */}
                    <div className="space-y-6">
                        <section className="bg-gradient-to-br from-purple-800 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 opacity-10 text-[140px] pointer-events-none transform translate-x-12 -translate-y-8 group-hover:scale-110 transition-transform duration-700">🎫</div>
                            <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 flex items-center gap-2 leading-tight">
                                {isTamil ? 'மாணவர்களை அழைக்கவும்' : 'Invite New Champions'}
                            </h3>
                            <p className="text-purple-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 leading-relaxed">
                                Share an invite code with your students to automatically link them to this academy and unlock premium curriculum.
                            </p>

                            {!inviteCode ? (
                                <button
                                    onClick={() => handleCreateInvite('student')}
                                    disabled={creatingInvite}
                                    className="w-full bg-white text-purple-700 hover:bg-gray-50 py-3.5 sm:py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm sm:text-base border border-transparent"
                                >
                                    {creatingInvite ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin"></div>
                                            <span>Creating...</span>
                                        </div>
                                    ) : (isTamil ? 'குறியீட்டை உருவாக்கு' : 'Get Student Link')}
                                </button>
                            ) : (
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center animate-bounce-in shadow-inner">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-3">Share this code</div>
                                    <div className="text-4xl sm:text-5xl font-black mb-4 tracking-widest font-mono text-white drop-shadow-md">{inviteCode}</div>
                                    <button
                                        onClick={() => setInviteCode(null)}
                                        className="text-[10px] sm:text-xs text-white/50 hover:text-white underline font-bold transition-all uppercase tracking-widest"
                                    >
                                        Create New Code
                                    </button>
                                </div>
                            )}
                        </section>

                        <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h4 className="font-black text-gray-900 text-lg mb-3 flex items-center gap-2 tracking-tight">
                                    <span>👩‍🏫</span> {isTamil ? 'ஆசிரியர்களை அழைக்கவும்' : 'Staff Management'}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 font-medium leading-relaxed">Add teaching staff to manage classrooms and track student progress at scale.</p>
                            </div>
                            <button
                                onClick={() => handleCreateInvite('teacher')}
                                className="w-full bg-gray-900 hover:bg-black text-white py-3.5 sm:py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
                            >
                                {isTamil ? 'ஆசிரியரை அழைக்கவும்' : 'Invite Teacher'}
                            </button>
                        </section>

                        <div className="p-6 sm:p-8 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden">
                            <h4 className="font-bold text-amber-900 flex items-center gap-2 text-xs uppercase tracking-widest">
                                <span>🛡️</span> {isTamil ? 'நிர்வாக உதவி' : 'Admin Support'}
                            </h4>
                            <p className="text-xs text-amber-800/80 mt-2 font-medium leading-relaxed max-w-[250px]">
                                Need help batch-uploading students from an Excel sheet or customizing your academy logo? Contact our B2B support team.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
