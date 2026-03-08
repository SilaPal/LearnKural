'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/use-auth';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';

export default function RegisterClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);

    const [mode, setMode] = useState<'register' | 'join'>('register');
    const [joinCode, setJoinCode] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);
    }, []);

    const toggleLanguage = () => {
        const next = !isTamil;
        setIsTamil(next);
        localStorage.setItem('thirukural-language', next ? 'tamil' : 'english');
        window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: next } }));
    };

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

    const [isPendingApproval, setIsPendingApproval] = useState(false);

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
                setIsPendingApproval(true);
            } else {
                setError(data.error || 'Failed to create school');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const isPaid = user?.tier === 'paid';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col items-center py-0 px-4 shadow-inner relative">
            <PageHeader
                gradientClass="bg-gradient-to-r from-indigo-700 to-slate-800"
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
            <div className="max-w-2xl w-full pt-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-indigo-900 mb-2">
                        {isTamil ? 'தமிழ் பள்ளிக் கூடம் 🏛️' : 'Tamil School Portal'}
                    </h1>
                    <p className="text-indigo-600 font-medium">
                        {isTamil ? 'உங்கள் மாணவர்களுக்கான ஒரு புதிய கற்றல் அனுபவம்' : 'A modern gamified experience for your students'}
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white">


                    <div className="px-8 pb-10">
                        {isPendingApproval ? (
                            <div className="text-center py-10 animate-fade-in">
                                <div className="text-6xl mb-6">📬</div>
                                <h2 className="text-2xl font-black text-indigo-900 mb-4">
                                    {isTamil ? 'கோரிக்கை அனுப்பப்பட்டது!' : 'Registration Received!'}
                                </h2>
                                <p className="text-indigo-600 font-medium mb-8 leading-relaxed">
                                    {isTamil
                                        ? 'உங்கள் பள்ளிக்கான விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. நிர்வாகியின் ஒப்புதலுக்குப் பிறகு மின்னஞ்சல் மூலம் உங்களுக்குத் தெரிவிக்கப்படும்.'
                                        : 'Your school registration request has been submitted successfully. Our administrators will review it shortly, and you will be notified via email once approved.'}
                                </p>
                                <Link
                                    href="/"
                                    className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition hover:scale-105 active:scale-95"
                                >
                                    {isTamil ? 'முகப்புக்குத் திரும்புக' : 'Return to Home'}
                                </Link>
                            </div>

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
