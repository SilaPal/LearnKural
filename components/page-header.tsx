'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';
import { SharedUserMenu } from '@/components/shared-user-menu';

interface PageHeaderProps {
    /** Gradient classes for the header bg. Defaults to purple/indigo. */
    gradientClass?: string;
    /** Back-button destination. Defaults to '/'. */
    backHref?: string;
    /** Whether to show back arrow. Defaults to true. */
    showBack?: boolean;
    /** Called when the Login button is clicked. If not provided, redirects to home. */
    onLoginClick?: () => void;
    /** Called when the Plan badge is clicked. If not provided, no action. */
    onUpgradeClick?: () => void;
    /** Optional children rendered below the logo row (e.g. region tabs). */
    children?: React.ReactNode;
}

/**
 * Shared header used across all inner pages (leaderboard, school portal,
 * dashboards, etc.). Shows the Tamili logo, a back button, the Tamil/English
 * toggle, and the Google avatar/login button.
 *
 * Does NOT mount AuthModal or PricingModal — those live on the page level.
 * Pass onLoginClick / onUpgradeClick to hook into them.
 */
export default function PageHeader({
    gradientClass = 'bg-gradient-to-r from-purple-700 to-indigo-700',
    backHref = '/',
    showBack = true,
    onLoginClick,
    onUpgradeClick,
    children,
}: PageHeaderProps) {
    const { user, logout } = useAuth();
    const [isTamil, setIsTamil] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isPaidUser = user?.tier === 'paid';

    useEffect(() => {
        const saved = localStorage.getItem('thirukural-language');
        if (saved === 'tamil') setIsTamil(true);
    }, []);

    const toggleLanguage = () => {
        setIsTamil(v => {
            const next = !v;
            localStorage.setItem('thirukural-language', next ? 'tamil' : 'english');
            window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: next } }));
            return next;
        });
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const handleLoginClick = () => {
        if (onLoginClick) {
            onLoginClick();
        } else {
            // Fall back to home page which has the full auth flow
            window.location.href = '/';
        }
    };

    const handleUpgradeClick = () => {
        if (onUpgradeClick) {
            onUpgradeClick();
        }
    };

    return (
        <header className={`${gradientClass} text-white shadow-lg`}>
            {/* Top nav row — logo left, centered title, controls right */}
            <div className="max-w-5xl mx-auto px-4 py-3 relative flex items-center justify-between">
                {/* Left: back arrow + logo icon */}
                <div className="flex items-center gap-2 z-10">
                    {showBack && (
                        <Link
                            href={backHref}
                            className="p-1.5 hover:bg-white/20 rounded-full transition"
                            title={isTamil ? 'முகப்பு' : 'Back'}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </Link>
                    )}
                    <Link href="/">
                        <img src="/logo.png" alt="Tamili Logo" className="h-8 w-8 rounded-full" width={32} height={32} />
                    </Link>
                </div>

                {/* Centered title */}
                <Link
                    href="/"
                    className="absolute left-1/2 -translate-x-1/2 font-black text-white text-base sm:text-lg tracking-tight whitespace-nowrap pointer-events-auto drop-shadow"
                >
                    {isTamil ? 'திருக்குறள் மேடை' : 'Thirukkural Stage'}
                </Link>

                {/* Right: language toggle + user */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-semibold"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        {isTamil ? 'English' : 'தமிழ்'}
                    </button>

                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(v => !v)}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                title={user.name}
                            >
                                {user.picture ? (
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        className="h-9 w-9 rounded-full border-2 border-white/60 shadow-lg"
                                    />
                                ) : (
                                    <div className="h-9 w-9 rounded-full bg-white/20 border-2 border-white/60 shadow-lg flex items-center justify-center text-white font-bold text-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </button>

                            {showUserMenu && (
                                <SharedUserMenu
                                    user={{
                                        id: user.id || '',
                                        name: user.name,
                                        email: user.email,
                                        picture: user.picture || undefined,
                                        tier: user.tier || 'free',
                                        role: user.role || 'user'
                                    }}
                                    isTamil={isTamil}
                                    isPaidUser={isPaidUser}
                                    onClose={() => setShowUserMenu(false)}
                                    onUpgradeClick={handleUpgradeClick}
                                    onLogout={logout}
                                />
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={handleLoginClick}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-lg transition-all text-sm font-semibold"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            {isTamil ? 'உள்நுழைவு' : 'Login'}
                        </button>
                    )}
                </div>
            </div>

            {/* Optional slot for page-specific content (title, tabs, etc.) */}
            {children && (
                <div className="max-w-5xl mx-auto px-4 pb-4">
                    {children}
                </div>
            )}
        </header>
    );
}
