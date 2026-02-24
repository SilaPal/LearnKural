'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);
    }, []);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'school_admin')) {
            router.push('/');
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-slate-800">{error}</h2>
                <Link href="/" className="mt-6 inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold">Back Home</Link>
            </div>
        </div>
    );

    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Header Area */}
            <div className="bg-indigo-900 text-white pt-12 pb-24 px-4 sm:px-8 shadow-inner">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-indigo-500/30 text-indigo-200 text-xs font-black uppercase tracking-widest px-2 py-1 rounded">Academy Dashboard</span>
                            <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Active Subscription</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{data.school.name}</h1>
                        <p className="text-indigo-300 mt-2 font-medium opacity-80">
                            ID: <span className="font-mono">{data.school.id}</span> • School Administrator Panel
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold transition-all border border-white/10 flex items-center gap-2">
                            🏠 {isTamil ? 'முகப்பு' : 'Home'}
                        </Link>
                        <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold transition-all border border-white/10">
                            {isTamil ? 'அமைப்புகள்' : 'Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-white/50 flex items-center justify-between">
                        <div>
                            <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{isTamil ? 'மாணவர்கள்' : 'Total Students'}</div>
                            <div className="text-4xl font-black text-slate-800">{data.stats.students}</div>
                        </div>
                        <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">👦</div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-white/50 flex items-center justify-between">
                        <div>
                            <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{isTamil ? 'வகுப்பறைகள்' : 'Active Classes'}</div>
                            <div className="text-4xl font-black text-slate-800">{data.stats.classrooms}</div>
                        </div>
                        <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🏫</div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-white/50 flex items-center justify-between">
                        <div>
                            <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{isTamil ? 'குறள் தேர்ச்சி' : 'Mastery Score'}</div>
                            <div className="text-4xl font-black text-orange-600">84%</div>
                        </div>
                        <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🎯</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Classrooms & Management */}
                    <div className="lg:col-span-2 space-y-10">
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-slate-800">{isTamil ? 'வகுப்பறைகள்' : 'Classrooms'}</h2>
                                <button className="text-indigo-600 font-black hover:underline text-sm">+ {isTamil ? 'புதிய வகுப்பு' : 'Add New Class'}</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.classrooms.length === 0 ? (
                                    <div className="col-span-2 bg-slate-100/50 border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center text-slate-400 font-bold">
                                        No classrooms created yet.
                                    </div>
                                ) : (
                                    data.classrooms.map(c => (
                                        <div key={c.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 font-sans hover:shadow-xl hover:border-indigo-100 transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{c.name}</h3>
                                                <div className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded uppercase">Standard Plan</div>
                                            </div>
                                            <div className="text-sm text-slate-500 space-y-2 mb-6">
                                                <div className="flex items-center gap-2 font-medium">👨‍🏫 Teacher: {c.teacherId || 'Not assigned'}</div>
                                                <div className="flex items-center gap-2 font-medium">👥 Students: 0</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors border border-slate-200">Manage</button>
                                                <button
                                                    onClick={() => handleCreateInvite('student', c.id)}
                                                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-2.5 rounded-xl text-sm transition-colors border border-indigo-100"
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
                            <h2 className="text-2xl font-black text-slate-800 mb-6">{isTamil ? 'அண்மைய செயல்பாடுகள்' : 'Recent Joins'}</h2>
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                {data.recentUsers.length === 0 ? (
                                    <div className="p-10 text-center text-slate-400 font-bold italic">No students joined yet. Use the invite section to bring them in!</div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {data.recentUsers.map(u => (
                                            <div key={u.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl overflow-hidden shadow-inner flex-shrink-0">
                                                        {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" /> : '🧒'}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 tracking-tight">{u.name}</div>
                                                        <div className="text-xs text-slate-400 font-bold lowercase tracking-normal flex items-center gap-2">
                                                            {u.email}
                                                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                                            {new Date(u.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1.5">Role</div>
                                                    <div className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${u.role === 'teacher' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
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
                        <section className="bg-gradient-to-br from-indigo-600 to-purple-800 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 opacity-10 text-[140px] pointer-events-none transform translate-x-12 -translate-y-8 group-hover:scale-110 transition-transform duration-700">🎫</div>
                            <h3 className="text-2xl font-black mb-4 flex items-center gap-2 leading-tight">
                                {isTamil ? 'மாணவர்களை அழைக்கவும்' : 'Invite New Champions'}
                            </h3>
                            <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed opacity-90">
                                Share an invite code with your students to automatically link them to this academy and unlock premium curriculum.
                            </p>

                            {!inviteCode ? (
                                <button
                                    onClick={() => handleCreateInvite('student')}
                                    disabled={creatingInvite}
                                    className="w-full bg-white text-indigo-700 hover:bg-slate-50 py-5 rounded-2xl font-black transition-all shadow-xl active:scale-95 disabled:opacity-50 text-lg"
                                >
                                    {creatingInvite ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <span>Creating...</span>
                                        </div>
                                    ) : (isTamil ? 'குறியீட்டை உருவாக்கு' : 'Get Student Link')}
                                </button>
                            ) : (
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center animate-bounce-in shadow-inner">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-3 opacity-80">Share this code</div>
                                    <div className="text-5xl font-black mb-5 tracking-widest font-mono text-white drop-shadow-lg">{inviteCode}</div>
                                    <button
                                        onClick={() => setInviteCode(null)}
                                        className="text-xs text-white/40 hover:text-white underline font-bold transition-all uppercase tracking-widest"
                                    >
                                        Create New Code
                                    </button>
                                </div>
                            )}
                        </section>

                        <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-white/50 relative">
                            <h4 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                                <span>👩‍🏫</span> {isTamil ? 'ஆசிரியர்களை அழைக்கவும்' : 'Staff Management'}
                            </h4>
                            <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">Add teaching staff to manage classrooms and track student progress at scale.</p>
                            <button
                                onClick={() => handleCreateInvite('teacher')}
                                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                            >
                                {isTamil ? 'ஆசிரியரை அழைக்கவும்' : 'Invite Teacher'}
                            </button>
                        </section>

                        <div className="p-8 bg-amber-50 rounded-[2rem] border-4 border-amber-100/50 shadow-inner">
                            <h4 className="font-black text-amber-900 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <span>🛡️</span> {isTamil ? 'நிர்வாக உதவி' : 'Admin Support'}
                            </h4>
                            <p className="text-xs text-amber-800/70 mt-3 font-semibold leading-relaxed">
                                Need help batch-uploading students from an Excel sheet or customizing your academy logo? Contact our B2B support team.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
