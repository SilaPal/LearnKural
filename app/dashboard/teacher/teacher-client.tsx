'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);
    }, []);

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
        <div className="min-h-screen bg-indigo-50/30 flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-indigo-50/30 flex items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-slate-800">{error}</h2>
                <Link href="/" className="mt-6 inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold">Back Home</Link>
            </div>
        </div>
    );

    if (!data) return null;

    const filteredStudents = selectedClassId === 'all'
        ? data.students
        : data.students.filter(s => s.classroomId === selectedClassId);

    return (
        <div className="min-h-screen bg-indigo-50/20 font-sans pb-20">
            {/* Nav Header */}
            <div className="bg-white border-b border-indigo-100 px-4 py-4 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-2xl transition-transform hover:scale-110">🏠</Link>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">{isTamil ? 'ஆசிரியர் மேடை' : 'Teacher Dashboard'}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl uppercase tracking-[0.1em] border border-indigo-100 shadow-inner">{user?.name}</span>
                        <Link href="/" className="text-slate-400 hover:text-indigo-600 transition-all hover:scale-110">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 py-10">
                {/* Stats Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-indigo-900 mb-3 tracking-tight">{isTamil ? 'உங்கள் மாணவர்கள்' : 'Classroom Mastery'} 🎓</h2>
                        <p className="text-slate-500 font-bold opacity-80">Monitoring {data.students.length} students across {data.classrooms.length} classes.</p>
                    </div>

                    <div className="flex bg-white p-1.5 rounded-2xl shadow-xl border border-white/50">
                        <button
                            onClick={() => setSelectedClassId('all')}
                            className={`px-6 py-2.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${selectedClassId === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.05]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
                        >
                            {isTamil ? 'அனைத்தும்' : 'All Classes'}
                        </button>
                        {data.classrooms.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedClassId(c.id)}
                                className={`px-6 py-2.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${selectedClassId === c.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.05]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Students Table/Grid */}
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/50">
                    {filteredStudents.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="text-7xl mb-8 animate-bounce">🏝️</div>
                            <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">No students yet</h3>
                            <p className="text-slate-400 font-bold opacity-70 max-w-sm mx-auto">Share your classroom invite code or link to begin tracking student progress in real-time.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isTamil ? 'மாணவர்' : 'Student'}</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isTamil ? 'வகுப்பு' : 'Class'}</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isTamil ? 'தேர்ச்சி' : 'Mastery Progress'}</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{isTamil ? 'நிலை' : 'Status'}</th>
                                        <th className="px-8 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.map(student => {
                                        const progressPercent = Math.min(100, Math.round((student.progress.completedChapters.length / 133) * 100));
                                        const classroomName = data.classrooms.find(c => c.id === student.classroomId)?.name || 'General';

                                        return (
                                            <tr key={student.id} className="hover:bg-indigo-50/30 transition-all group duration-300">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl overflow-hidden shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform">
                                                            {student.picture ? <img src={student.picture} alt="" className="w-full h-full object-cover" /> : '🧒'}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-800 tracking-tight text-lg group-hover:text-indigo-600 transition-colors">{student.name}</div>
                                                            <div className="text-xs text-slate-400 font-bold lowercase tracking-normal opacity-80">{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="bg-indigo-50/50 text-indigo-600 text-[10px] font-black px-3 py-2 rounded-xl border border-indigo-100/50 uppercase tracking-widest shadow-sm">{classroomName}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="w-56">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.progress.completedChapters.length} / 133 Nodes</span>
                                                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shadow-sm">{progressPercent}%</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-1000 ease-out shadow-lg"
                                                                style={{ width: `${progressPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-200"></span>
                                                        <span className="text-xs font-bold text-slate-500">Learning Now</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
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
