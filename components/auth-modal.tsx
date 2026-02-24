'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    isTamil?: boolean;
}

export default function AuthModal({ isOpen, onClose, isTamil = false }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const { refetch } = useAuth();

    // Check for auth errors from OAuth redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('auth_error');
        if (error === 'user_not_found') {
            setIsLogin(false);
            setAuthError(isTamil
                ? 'இந்த மின்னஞ்சலில் கணக்கு இல்லை. முதலில் பதிவு செய்யவும்.'
                : 'No account found. Please sign up first.');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [isTamil]);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setAuthError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        setAuthError(null);
        setEmail('');
    }, [isLogin]);

    const handleGoogleAuth = () => {
        const stateData = isLogin ? { isLoginMode: true } : {};
        const state = JSON.stringify({ ...stateData, redirectTo: window.location.pathname });
        const encodedState = btoa(state);
        let url = `/api/auth/google?state=${encodedState}`;
        if (email) url += `&login_hint=${encodeURIComponent(email)}`;
        // Refetch user after redirect comes back
        window.location.href = url;
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={isTamil ? 'உள்நுழைவு / பதிவு' : 'Login / Sign Up'}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header gradient */}
                <div className="bg-gradient-to-br from-purple-800 via-purple-600 to-violet-500 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {isLogin
                                    ? (isTamil ? 'வரவேற்கிறோம்!' : 'Welcome Back!')
                                    : (isTamil ? 'தொடங்குவோம்!' : 'Get Started!')}
                            </h2>
                            <p className="text-purple-200 text-sm mt-0.5">
                                {isLogin
                                    ? (isTamil ? 'உங்கள் கணக்கில் உள்நுழையவும்' : 'Sign in to your account')
                                    : (isTamil ? 'புதிய கணக்கை உருவாக்கவும்' : 'Create your free account')}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-purple-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
                            aria-label={isTamil ? 'மூடு' : 'Close'}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Login / Sign Up toggle */}
                    <div className="flex mt-4 bg-white/20 rounded-full p-1">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-1.5 rounded-full text-sm font-semibold transition-all ${isLogin ? 'bg-white text-purple-700 shadow' : 'text-white hover:bg-white/10'
                                }`}
                        >
                            {isTamil ? 'உள்நுழைவு' : 'Login'}
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-1.5 rounded-full text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-purple-700 shadow' : 'text-white hover:bg-white/10'
                                }`}
                        >
                            {isTamil ? 'பதிவு' : 'Sign Up'}
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {authError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                            {authError}
                        </div>
                    )}

                    {/* Optional email hint */}
                    <div>
                        <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">
                            {isLogin
                                ? (isTamil ? 'மின்னஞ்சல் (விருப்பத்தேர்வு)' : 'Email (Optional)')
                                : (isTamil ? 'மின்னஞ்சல் முகவரி' : 'Email Address')}
                        </label>
                        <input
                            id="auth-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        />
                    </div>

                    {/* Google button */}
                    <button
                        onClick={handleGoogleAuth}
                        id="google-auth-btn"
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-md"
                    >
                        {/* Google SVG logo */}
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {isLogin
                            ? (isTamil ? 'Google மூலம் உள்நுழையவும்' : 'Login with Google')
                            : (isTamil ? 'Google மூலம் பதிவு செய்யவும்' : 'Sign up with Google')}
                    </button>

                    {/* Toggle link */}
                    <p className="text-center text-sm text-gray-500">
                        {isLogin ? (
                            <>
                                {isTamil ? 'கணக்கு இல்லையா? ' : "Don't have an account? "}
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className="text-purple-600 font-semibold hover:underline focus:outline-none"
                                >
                                    {isTamil ? 'பதிவு செய்யவும்' : 'Sign up'}
                                </button>
                            </>
                        ) : (
                            <>
                                {isTamil ? 'ஏற்கனவே கணக்கு உள்ளதா? ' : 'Already have an account? '}
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className="text-purple-600 font-semibold hover:underline focus:outline-none"
                                >
                                    {isTamil ? 'உள்நுழையவும்' : 'Login'}
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
