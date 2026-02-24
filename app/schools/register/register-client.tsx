'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/use-auth';
import Link from 'next/link';

export default function RegisterClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);

    const [mode, setMode] = useState<'register' | 'join'>('join');
    const [joinCode, setJoinCode] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);
    }, []);

    if (!isLoading && !user) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold mb-4">{isTamil ? 'உள்நுழையவும்' : 'Please Sign In'}</h2>
                    <p className="text-gray-600 mb-6">{isTamil ? 'தொடர நீங்கள் முதலில் உள்நுழைய வேண்டும்.' : 'You must be signed in to register or join a school.'}</p>
                    <Link href="/" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition">
                        {isTamil ? 'முகப்புக்குச் செல்க' : 'Go Home to Login'}
                    </Link>
                </div>
            </div>
        );
    }

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/schools/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: joinCode })
            });
            const data = await res.json();
            if (data.success) {
                router.push(data.role === 'teacher' ? '/dashboard/teacher' : '/quest');
            } else {
                setError(data.error || 'Failed to join');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/schools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: schoolName })
            });
            const data = await res.json();
            if (data.id) {
                router.push('/dashboard/school');
            } else {
                setError(data.error || 'Failed to create school');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col items-center py-12 px-4 shadow-inner">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-indigo-900 mb-2">
                        {isTamil ? 'தமிழ் பள்ளிக் கூடம்' : 'Tamil School Portal'} 🏫
                    </h1>
                    <p className="text-indigo-600 font-medium">
                        {isTamil ? 'உங்கள் மாணவர்களுக்கான ஒரு புதிய கற்றல் அனுபவம்' : 'A modern gamified experience for your students'}
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white">
                    <div className="flex bg-slate-100 p-1.5 m-6 rounded-2xl shadow-inner">
                        <button
                            onClick={() => setMode('join')}
                            className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 ${mode === 'join' ? 'bg-white text-indigo-700 shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {isTamil ? 'சேரவும்' : 'Join a School'}
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 ${mode === 'register' ? 'bg-white text-indigo-700 shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {isTamil ? 'பதிவு செய்யவும்' : 'Register New School'}
                        </button>
                    </div>

                    <div className="px-8 pb-10">
                        {mode === 'join' ? (
                            <form onSubmit={handleJoin} className="space-y-6">
                                <div className="text-center">
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-4">
                                        {isTamil ? 'அழைப்புக் குறியீடு' : 'Invite Code'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder="E.g. AX79B2"
                                        className="w-48 px-6 py-5 bg-slate-50 border-4 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none text-2xl font-black text-center tracking-widest shadow-inner"
                                    />
                                    <p className="mt-4 text-sm text-slate-500 max-w-sm mx-auto">
                                        {isTamil ? 'உங்கள் ஆசிரியர் வழங்கிய 6 இலக்கக் குறியீட்டை இங்கே உள்ளிடவும்.' : 'Enter the 6-character code provided by your teacher or admin to connect your account.'}
                                    </p>
                                </div>

                                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border-2 border-red-100 text-center animate-shake">{error}</div>}

                                <button
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-lg"
                                >
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </div>
                                    ) : (isTamil ? 'நுழையவும்' : 'Join Academy')}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">
                                        {isTamil ? 'பள்ளியின் பெயர்' : 'School / Academy Name'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={schoolName}
                                        onChange={(e) => setSchoolName(e.target.value)}
                                        placeholder="E.g. Silicon Valley Tamil Academy"
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none font-bold text-lg"
                                    />
                                </div>

                                <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 shadow-sm">
                                    <div className="flex gap-4">
                                        <div className="text-3xl">👑</div>
                                        <div>
                                            <h4 className="font-black text-indigo-900 leading-tight mb-1">{isTamil ? 'நிர்வாகி அணுகல்' : 'School Admin Access'}</h4>
                                            <p className="text-sm text-indigo-700 font-medium">
                                                {isTamil ? 'நீங்கள் இந்தப் பள்ளியின் உரிமையாளராக இருப்பீர்கள். உங்களால் ஆசிரியர்களை சேர்க்க முடியும்.' : 'You will be set as the administrator. This allows you to invite teachers, create classrooms, and see student progress reports.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm border-2 border-red-100 text-center">{error}</div>}

                                <button
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-lg"
                                >
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Creating...</span>
                                        </div>
                                    ) : (isTamil ? 'பதிவு செய்' : 'Register & Start Journey')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center flex flex-col gap-4">
                    <Link href="/" className="text-slate-500 hover:text-indigo-600 font-bold transition text-sm">
                        ← {isTamil ? 'முகப்பு' : 'Back to Home'}
                    </Link>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black opacity-50">
                        Secure B2B Portal • Built for Tamil Educators
                    </div>
                </div>
            </div>
        </div>
    );
}
