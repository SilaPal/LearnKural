'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    /** Called when "Achievements" is clicked in the user menu. */
    onBadgesClick?: () => void;
    /** Number of unviewed badges — shown as indicator on Achievements menu item. */
    newBadgeCount?: number;
    /** Optional title to show in the center. Defaults to 'திருக்குறள்'. */
    title?: string;
    /** Optional: called when user clicks the heart to toggle the current item as a favorite. */
    onToggleFavorite?: () => void;
    /** Whether the current item is already favorited — controls filled vs outline heart. */
    isFavorited?: boolean;
    /** Current language state from parent. If provided, the header becomes controlled. */
    isTamil?: boolean;
    /** Called when the language toggle is clicked. */
    toggleLanguage?: () => void;
    /** Streak count — shown as a fire icon next to heart icon. */
    streakCount?: number;
    /** Coin count — shown as a coin bag icon next to fire icon. */
    coinCount?: number;
    /** Called when the streak (fire) icon is clicked (opens Navigation). */
    onStreakClick?: () => void;
    /** Called when the coin bag icon is clicked (opens Progress/Badges). */
    onCoinClick?: () => void;
    /** Optional max-width class for content alignment. Defaults to max-w-4xl. */
    maxWidthClass?: string;
    /** Whether to show coin count on the right side instead of left. */
    showCoinOnRight?: boolean;
    /** Optional children rendered below the logo row (e.g. region tabs). */
    children?: React.ReactNode;
}

/**
 * Shared header used across all inner pages.
 * Layout:
 *   Row 1 (inside gradient): logo | centered title | user avatar/login
 *   Row 2 (transparent/below): Per-page controls (favorites, fire, coins, language toggle)
 */
interface ChildProfile {
    id: string;
    nickname: string;
    activeAvatarId: string;
    avatarThumbnail?: string | null;
}

export default function PageHeader({
    gradientClass = 'bg-gradient-to-br from-purple-800 via-purple-600 to-violet-500',
    backHref = '/',
    showBack = true,
    onLoginClick,
    onUpgradeClick,
    onBadgesClick,
    newBadgeCount = 0,
    title,
    onToggleFavorite,
    isFavorited,
    isTamil: isTamilProp,
    toggleLanguage: toggleLanguageProp,
    streakCount,
    coinCount,
    onStreakClick,
    onCoinClick,
    showCoinOnRight = false,
    maxWidthClass = 'max-w-4xl',
    children
}: PageHeaderProps) {
    const { user, logout, refetch } = useAuth();
    const isPaidUser = user?.tier === 'paid';
    const hasChildProfiles = !!(user?.activeProfileId);
    const [isTamilInternal, setIsTamilInternal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [profiles, setProfiles] = useState<ChildProfile[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    // If isTamilProp is provided, we use it (controlled mode).
    // Otherwise, we use internal state (uncontrolled fallback).
    const isTamil = isTamilProp !== undefined ? isTamilProp : isTamilInternal;

    useEffect(() => {
        if (isTamilProp === undefined) {
            const saved = localStorage.getItem('thirukural-language');
            if (saved === 'tamil') {
                setIsTamilInternal(true);
            }
        }
    }, [isTamilProp]);

    // Fetch child profiles when user is logged in
    useEffect(() => {
        if (user) {
            fetch('/api/child-profiles')
                .then(res => res.json())
                .then(data => setProfiles(data.profiles || []))
                .catch(err => console.error('Failed to fetch profiles:', err));
        }
    }, [user]);

    const handleProfileSwitch = async (profileId: string | null) => {
        try {
            const res = await fetch('/api/child-profiles/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId }),
            });
            if (res.ok) {
                // Force a full page reload to ensure all components observe the session change
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to switch profile:', err);
        }
    };

    const toggleLanguage = () => {
        if (toggleLanguageProp) {
            toggleLanguageProp();
        } else {
            const next = !isTamilInternal;
            setIsTamilInternal(next);
            localStorage.setItem('thirukural-language', next ? 'tamil' : 'english');
            // Notify other components (like home page or non-prop listeners)
            window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: next } }));
        }
    };

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
            window.location.href = '/';
        }
    };

    return (
        <div suppressHydrationWarning className="w-full">
            {/* ── Row 1: gradient bar with logo, title, user ── */}
            <header className={`${gradientClass} text-white shadow-lg py-5 sm:py-7 relative`}>
                <div className={`${maxWidthClass} mx-auto px-4 flex items-center justify-between`}>
                    {/* Left: back arrow + logo */}
                    <div className="flex items-center gap-3 z-10">
                        {showBack && (
                            <Link
                                href={backHref}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                                title={isTamil ? 'முகப்பு' : 'Back'}
                            >
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </Link>
                        )}
                        <Link href="/" className="flex items-center">
                            <Image src="/logo.png" alt="Tamili Logo" className="h-12 w-12 rounded-full border-2 border-white/20 shadow-md" width={48} height={48} priority />
                        </Link>
                    </div>

                    {/* Centered title */}
                    <Link
                        href="/"
                        className="absolute left-1/2 -translate-x-1/2 font-bold text-white text-2xl sm:text-3xl tracking-tight whitespace-nowrap pointer-events-auto drop-shadow-md"
                    >
                        <span suppressHydrationWarning>{title || (isTamil ? 'திருக்குறள்' : 'Thirukkural')}</span>
                    </Link>

                    {/* Right: user avatar / login button — absolute so dropdown isn't clipped by header */}
                    <div className="absolute top-0 bottom-0 right-4 flex items-center gap-2 z-50" ref={menuRef}>
                        {user ? (
                            <>
                                {/* Active child profile indicator — clickable, returns to selector */}
                                {user.activeProfileNickname && (
                                    <Link
                                        href="/profile-select"
                                        className="hidden sm:flex items-center gap-1.5 bg-orange-500/30 border border-orange-300/50 rounded-full px-3 py-1 hover:bg-orange-500/50 transition-colors cursor-pointer"
                                        title="Switch profile"
                                    >
                                        <span className="text-xs text-white font-bold">{user.activeProfileNickname}</span>
                                        <span className="text-white/70 text-xs">↩</span>
                                    </Link>
                                )}
                                <button
                                    onClick={() => setShowUserMenu(v => !v)}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    title={user.activeProfileNickname || user.name}
                                >
                                    {user.picture ? (
                                        <Image
                                            src={user.picture}
                                            alt={user.activeProfileNickname || user.name}
                                            className="h-9 w-9 rounded-full border-2 border-white/60 shadow-lg"
                                            width={36}
                                            height={36}
                                        />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-white/20 border-2 border-white/60 shadow-lg flex items-center justify-center text-white font-bold text-sm">
                                            {(user.activeProfileNickname || user.name).charAt(0).toUpperCase()}
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
                                        onUpgradeClick={onUpgradeClick}
                                        onBadgesClick={onBadgesClick}
                                        newBadgeCount={newBadgeCount}
                                        onLogout={logout}
                                        hasChildProfiles={hasChildProfiles}
                                        activeProfileNickname={user.activeProfileNickname}
                                        profiles={profiles}
                                        onProfileSwitch={handleProfileSwitch}
                                    />
                                )}
                            </>
                        ) : (
                            <button
                                onClick={handleLoginClick}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-lg transition-all text-sm font-semibold backdrop-blur-sm shadow"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span suppressHydrationWarning>{isTamil ? 'உள்நுழைவு' : 'Login'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Optional slot for page-specific content (game-mode tabs, etc.) */}
                {children && (
                    <div className={`${maxWidthClass} mx-auto px-4 pb-4`}>
                        {children}
                    </div>
                )}
            </header>

            {/* ── Row 2: transparent sub-bar — Info (❤, 🔥, 💰) left · language toggle right ── */}
            <div className="w-full">
                <div className={`${maxWidthClass} mx-auto px-4 py-3 flex items-center justify-between`}>

                    {/* Left: Per-item favorite toggle, Streak, Coins */}
                    <div className="flex items-center gap-3">
                        {onToggleFavorite && (
                            <div className="relative group/toggle">
                                <button
                                    onClick={onToggleFavorite}
                                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 border-2 border-white/50 shadow-lg hover:bg-red-50 transition-all hover:scale-110"
                                    aria-label={isFavorited
                                        ? (isTamil ? 'விருப்பத்திலிருந்து நீக்கு' : 'Remove from favourites')
                                        : (isTamil ? 'விருப்பத்தில் சேர்' : 'Add to favourites')}
                                >
                                    {isFavorited ? (
                                        <svg className="h-7 w-7 text-red-500 transition-colors drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-7 w-7 text-gray-500 hover:text-red-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    )}
                                </button>
                                <div suppressHydrationWarning className="absolute left-1/2 -translate-x-1/2 top-13 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover/toggle:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg font-medium">
                                    {isFavorited
                                        ? (isTamil ? 'விருப்பத்திலிருந்து நீக்கு' : 'Remove from favourites')
                                        : (isTamil ? 'விருப்பத்தில் சேர்' : 'Add to favourites')}
                                </div>
                            </div>
                        )}

                        {streakCount !== undefined && (
                            <div className="relative group/streak">
                                <button
                                    onClick={onStreakClick}
                                    className="relative hover:scale-110 transition-transform flex items-center justify-center"
                                    aria-label={isTamil ? 'எனது முன்னேற்றம்' : 'My Progress'}
                                >
                                    <div className="h-12 w-12 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-50 transition-colors">
                                        <span className="text-2xl">🔥</span>
                                    </div>
                                    {streakCount >= 0 && (
                                        <span className="absolute -top-1 -right-1 bg-white border border-orange-500 text-orange-600 px-1.5 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                                            {streakCount}
                                        </span>
                                    )}
                                </button>
                                <div suppressHydrationWarning className="absolute left-1/2 -translate-x-1/2 top-13 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover/streak:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg font-medium">
                                    {isTamil ? 'வழிசெலுத்தல்' : 'Navigation'}
                                </div>
                            </div>
                        )}

                        {!showCoinOnRight && coinCount !== undefined && (
                            <div className="relative group/coins">
                                <button
                                    onClick={onCoinClick}
                                    className="relative hover:scale-110 transition-transform flex items-center justify-center"
                                    aria-label={isTamil ? 'நாணயங்கள்' : 'Coins'}
                                >
                                    <div className="h-12 w-12 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-50 transition-colors">
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <span suppressHydrationWarning className="absolute -top-1 -right-1 bg-white border border-yellow-600 text-yellow-700 px-1.5 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                                        {coinCount}
                                    </span>
                                </button>
                                <div suppressHydrationWarning className="absolute left-1/2 -translate-x-1/2 top-13 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover/coins:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg font-medium">
                                    {isTamil ? '🛒 சந்தையில் செலவிடு' : '🛒 Tap to spend in Shop'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: language toggle — same style as home page */}
                    <div className="flex items-center gap-3">
                        {showCoinOnRight && coinCount !== undefined && (
                            <div className="relative group/coins-right">
                                <button
                                    onClick={onCoinClick}
                                    className="flex items-center gap-2 bg-white/20 border-2 border-white/50 rounded-full px-3 py-1.5 shadow-lg hover:bg-yellow-50 transition-colors"
                                    aria-label={isTamil ? 'நாணயங்கள்' : 'Coins'}
                                >
                                    <span className="text-xl">🪙</span>
                                    <span className="font-black text-gray-800 text-sm">{coinCount}</span>
                                </button>
                                <div suppressHydrationWarning className="absolute right-0 top-11 bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover/coins-right:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg font-medium">
                                    {isTamil ? '🛒 சந்தையில் செலவிடு' : '🛒 Tap to spend in Shop'}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm shadow-md font-semibold"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <span suppressHydrationWarning>{isTamil ? 'English' : 'தமிழ்'}</span>
                        </button>
                    </div>
                </div >
            </div >
        </div >
    );
}
