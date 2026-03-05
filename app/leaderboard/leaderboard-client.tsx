'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import PageHeader from '@/components/page-header';
import BadgeModal from '@/components/badge-modal';
import Link from 'next/link';
import WorldMap from '@/components/world-map';
import AuthModal from '@/components/auth-modal';
import PricingModal from '@/components/pricing-modal';
import { SharedUserMenu } from '@/components/shared-user-menu';
import { useRef } from 'react';
import { useUserTier } from '@/lib/use-tier';

type Tab = 'weekly' | 'alltime' | 'streak';

interface LeaderboardEntry {
    id: string;
    name: string;
    picture: string | null;
    coins: number;
    weeklyXP: number;
    streak: number;
    longestStreak: number;
    activeAvatarId: string;
    avatarImageUrl: string | null;
    avatarThumbnailUrl?: string | null;
    region: string;
    tier: string;
    schoolName: string | null;
}

const MEDAL = ['🥇', '🥈', '🥉'];

const TAB_CONFIG: Record<Tab, { label: string; labelTamil: string; emoji: string; valueKey: keyof LeaderboardEntry; unit: string; unitTamil: string }> = {
    weekly: { label: 'This Week', labelTamil: 'இந்த வாரம்', emoji: '✨', valueKey: 'coins', unit: 'coins', unitTamil: 'நாணயம்' },
    alltime: { label: 'All Time', labelTamil: 'எல்லா நேரமும்', emoji: '🪙', valueKey: 'coins', unit: 'coins', unitTamil: 'நாணயம்' },
    streak: { label: 'Streaks', labelTamil: 'தொடர்ச்சி', emoji: '⚡', valueKey: 'streak', unit: 'days', unitTamil: 'நாள்' },
};

function Avatar({ entry, size = 'md' }: { entry: LeaderboardEntry; size?: 'sm' | 'md' | 'lg' }) {
    const cls = size === 'lg' ? 'h-16 w-16 text-2xl' : size === 'md' ? 'h-11 w-11 text-lg' : 'h-8 w-8 text-sm';

    // 1. Prefer Google Profile Picture if it exists and looks like a URL
    const hasPhoto = entry.picture && (entry.picture.startsWith('http') || entry.picture.startsWith('/') || entry.picture.includes('.'));
    if (hasPhoto) {
        return <img src={entry.picture!} alt={entry.name} className={`${cls} rounded-full object-cover flex-shrink-0 border border-gray-100 shadow-sm`} />;
    }

    // 2. Prefer character Thumbnail (HQ Preview)
    const hasThumbnail = entry.avatarThumbnailUrl && (entry.avatarThumbnailUrl.startsWith('http') || entry.avatarThumbnailUrl.startsWith('/') || entry.avatarThumbnailUrl.includes('.'));
    if (hasThumbnail) {
        return <img src={entry.avatarThumbnailUrl!} alt={entry.name} className={`${cls} rounded-full object-cover flex-shrink-0 border border-purple-200 shadow-sm bg-purple-50`} />;
    }

    // 3. Fallback to purchased Avatar Image/Emoji (Static characters)
    const hasAvatarImg = entry.avatarImageUrl && (entry.avatarImageUrl.startsWith('http') || entry.avatarImageUrl.startsWith('/') || entry.avatarImageUrl.includes('.'));
    if (hasAvatarImg) {
        return <img src={entry.avatarImageUrl!} alt={entry.name} className={`${cls} rounded-full object-cover flex-shrink-0 border border-purple-100 shadow-sm bg-purple-50`} />;
    }

    // 4. Default Character (Handle character IDs appearing as text)
    if (entry.avatarImageUrl && entry.avatarImageUrl.length > 2) {
        // This is likely a character ID like 'stickman', not an emoji
        // We should show initials or a generic icon if no URL is available
        return (
            <div className={`${cls} rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-700 flex-shrink-0 border border-indigo-100`}>
                {entry.name.charAt(0).toUpperCase()}
            </div>
        );
    }

    // 5. Use as emoji if short
    if (entry.avatarImageUrl) {
        return (
            <div className={`${cls} rounded-full bg-purple-50 flex items-center justify-center font-black flex-shrink-0 border border-purple-100 shadow-sm`}>
                {entry.avatarImageUrl}
            </div>
        );
    }

    // 6. Last fallback: Initial
    return (
        <div className={`${cls} rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-700 flex-shrink-0 border border-indigo-100`}>
            {entry.name.charAt(0).toUpperCase()}
        </div>
    );
}

function PodiumCard({ entry, rank, isTamil, tab }: { entry: LeaderboardEntry; rank: number; isTamil: boolean; tab: Tab }) {
    const cfg = TAB_CONFIG[tab];
    if (!entry) return null;
    const value = entry[cfg.valueKey] as number;

    const styles = [
        { order: 'order-2', height: 'h-28', bg: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400', text: 'text-yellow-600 bg-yellow-50' },
        { order: 'order-1', height: 'h-20', bg: 'from-slate-300 to-slate-400', ring: 'ring-slate-300', text: 'text-slate-500 bg-slate-50' },
        { order: 'order-3', height: 'h-16', bg: 'from-amber-600 to-amber-700', ring: 'ring-amber-500', text: 'text-amber-700 bg-amber-50' },
    ][rank];

    return (
        <div className={`flex flex-col items-center gap-1.5 ${styles.order}`}>
            <span className="text-xl flex-shrink-0">{MEDAL[rank]}</span>
            <div className={`relative ring-2 ${styles.ring} rounded-full shadow-md overflow-hidden bg-white`}>
                <Avatar entry={entry} size="md" />
            </div>
            <div className="text-center w-full px-1">
                <div className="font-bold text-slate-800 text-xs truncate w-full">{entry.name.split(' ')[0]}</div>
                {entry.schoolName && (
                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate w-full mt-0.5" title={entry.schoolName}>
                        {entry.schoolName}
                    </div>
                )}
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${styles.text}`}>
                    {value.toLocaleString()} {isTamil ? cfg.unitTamil : cfg.unit}
                </div>
            </div>
            <div className={`w-16 sm:w-20 ${styles.height} rounded-t-xl bg-gradient-to-b ${styles.bg} flex items-start justify-center pt-2 mt-auto`}>
                <span className="text-white font-black text-sm">#{rank + 1}</span>
            </div>
        </div>
    );
}


function FreeTierTeaser({ isTamil, isExpired }: { isTamil: boolean; isExpired?: boolean }) {
    return (
        <div className="relative overflow-hidden">
            {/* Blurred fake rows */}
            <div className="blur-sm pointer-events-none select-none px-4 py-6 space-y-3 opacity-40">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white rounded-2xl shadow p-4">
                        <div className="w-8 text-center text-gray-300 font-black text-sm">#{i + 1}</div>
                        <div className="h-11 w-11 rounded-full bg-purple-100" />
                        <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-28 mb-2" />
                            <div className="h-2.5 bg-gray-100 rounded w-16" />
                        </div>
                        <div className="h-4 bg-purple-100 rounded w-16" />
                    </div>
                ))}
            </div>

            {/* Lock card */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="bg-white border border-purple-100 rounded-3xl shadow-xl p-6 sm:p-8 max-w-sm w-full text-center">
                    <div className="text-5xl mb-3">🏆</div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">
                        {isTamil
                            ? (isExpired ? 'உங்கள் 30 நாள் இலவச சோதனை முடிந்தது' : 'பிரீமியம் பகுதி')
                            : (isExpired ? '30-Day Trial Expired' : 'Premium Feature')}
                    </h2>
                    <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                        {isTamil
                            ? (isExpired ? 'தொடர்ந்து உங்கள் தரவரிசையை காண பிரீமியத்திற்கு மாற்றுங்கள்.' : 'உலகளாவிய தரவரிசையை பார்க்க பிரீமியத்திற்கு மாற்றுங்கள்.')
                            : (isExpired ? 'Your 30-day free leaderboard trial has expired. Upgrade to Premium to keep your spot!' : 'Upgrade to Premium to see live rankings, compete weekly, and track your streak against Tamil learners worldwide.')}
                    </p>

                    <div className="space-y-2 text-left mb-5">
                        {[
                            { en: '🔥 Weekly Coins leaderboard', ta: '🔥 வார நாணயம் தரவரிசை' },
                            { en: '🏅 All-time rankings', ta: '🏅 எல்லா நேர தரவரிசை' },
                            { en: '⚡ Streak leaderboard', ta: '⚡ தொடர்ச்சி தரவரிசை' },
                            { en: '🌍 Regional rankings', ta: '🌍 பிராந்திய தரவரிசை' },
                        ].map(f => (
                            <div key={f.en} className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                                <span>{isTamil ? f.ta : f.en}</span>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/"
                        className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-3 rounded-xl hover:opacity-90 transition text-sm"
                    >
                        ✨ {isTamil ? 'பிரீமியம் தொடங்கு' : 'Upgrade to Premium'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LeaderboardClient() {
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [tab, setTab] = useState<Tab>('weekly');
    const [selectedRegion, setSelectedRegion] = useState('Global');
    const [loading, setLoading] = useState(true);
    const [isTamil, setIsTamil] = useState(false);

    const toggleLanguage = () => {
        const next = !isTamil;
        setIsTamil(next);
        localStorage.setItem('thirukural-language', next ? 'tamil' : 'english');
        window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: next } }));
    };
    const [myStats, setMyStats] = useState<{ coins: number; weeklyXP: number; streak: number } | null>(null);
    const [regionalLeaders, setRegionalLeaders] = useState<Record<string, {
        name: string,
        picture: string | null,
        streak: number;
        coins: number;
        weeklyXP: number;
    }>>({});

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        }
        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const { isPaid, isLoading: isTierLoading, trialDaysLeft, isTrialExpired } = useUserTier();
    const isPageLoading = isAuthLoading || isTierLoading;

    useEffect(() => {
        const saved = localStorage.getItem('thirukural-language');
        if (saved === 'tamil') setIsTamil(true);
        const handler = (e: Event) => setIsTamil((e as CustomEvent<{ isTamil: boolean }>).detail.isTamil);
        window.addEventListener('tamillanguagechange', handler);
        return () => window.removeEventListener('tamillanguagechange', handler);
    }, []);

    useEffect(() => {
        if (user) {
            // Refetch my stats (coins, xp, streak) whenever the user/profile context changes
            fetch('/api/user/coins')
                .then(r => r.json())
                .then(d => setMyStats({ coins: d.coins ?? 0, weeklyXP: d.weeklyXP ?? 0, streak: d.streak ?? 0 }))
                .catch(() => { });

            // Auto-switch to the profile's region if we're on Global
            if (selectedRegion === 'Global' && user.region && user.region !== 'Global') {
                setSelectedRegion(user.region);
            }
        }
    }, [user, user?.activeProfileId]);

    useEffect(() => {
        setLoading(true);
        const region = selectedRegion === 'Global' ? '' : `&region=${encodeURIComponent(selectedRegion)}`;
        fetch(`/api/leaderboard?tab=${tab}${region}`)
            .then((res) => res.json())
            .then((data) => {
                // The API now returns a flat array of entries for the requested tab/region
                setEntries(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch leaderboard:', err);
                setEntries([]);
                setLoading(false);
            });
    }, [tab, selectedRegion, isPaid, user?.activeProfileId]);

    // Derived data
    // Use effective identity for ranking (Child ID if playing as child, else Parent ID)
    const effectiveMeId = user?.activeProfileId || user?.id;
    const myRank = effectiveMeId ? entries.findIndex(e => e.id === effectiveMeId) : -1;
    const myEntry = myRank !== -1 ? entries[myRank] : null;
    const showStickyMe = myEntry && (myRank >= 3);
    useEffect(() => {
        fetch(`/api/leaderboard?tab=${tab}&region=Global`)
            .then(res => res.json())
            .then(data => {
                if (!Array.isArray(data)) return;
                const leaders: Record<string, {
                    name: string,
                    picture: string | null,
                    avatarImageUrl: string | null,
                    avatarThumbnailUrl: string | null,
                    streak: number;
                    coins: number;
                    weeklyXP: number;
                }> = {};
                for (const entry of data) {
                    if (entry.region && entry.region !== 'Global' && !leaders[entry.region]) {
                        leaders[entry.region] = {
                            name: entry.name,
                            picture: entry.picture,
                            avatarImageUrl: entry.avatarImageUrl,
                            avatarThumbnailUrl: entry.avatarThumbnailUrl,
                            streak: entry.streak,
                            coins: entry.coins,
                            weeklyXP: entry.weeklyXP
                        };
                    }
                }
                setRegionalLeaders(leaders);
            })
            .catch(() => { });
    }, [tab]);

    const cfg = TAB_CONFIG[tab];
    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <PageHeader
                gradientClass="bg-gradient-to-r from-blue-700 to-indigo-800"
                onLoginClick={() => setShowAuthModal(true)}
                onUpgradeClick={() => setShowPricingModal(true)}
                onBadgesClick={() => setShowBadgeModal(true)}
                isTamil={isTamil}
                toggleLanguage={toggleLanguage}
            >
                <div className="flex flex-col items-center">
                    <p className="text-sm opacity-90 text-center mb-1 max-w-sm">
                        {isTamil ? 'உலகெங்கிலும் உள்ள சிறந்தவர்கள்' : 'Top players from all around the world'}
                    </p>
                </div>
            </PageHeader>

            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* My stats strip */}
                {user && myStats && (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { label: isTamil ? 'வார புள்ளிகள்' : 'Weekly Points', value: myStats.weeklyXP, emoji: '🔥' },
                            { label: isTamil ? 'மொத்த நாணயம்' : 'Total Coins', value: myStats.coins, emoji: '🪙' },
                            { label: isTamil ? 'தொடர்ச்சி' : 'Streak', value: `${myStats.streak}d`, emoji: '⚡' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
                                <div className="text-2xl mb-1">{s.emoji}</div>
                                <div className="text-gray-900 font-black text-lg leading-none">{s.value}</div>
                                <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab bar */}
                <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 gap-1 mb-4">
                    {(Object.keys(TAB_CONFIG) as Tab[]).map(t => {
                        const c = TAB_CONFIG[t];
                        return (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${tab === t
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                                    : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {c.emoji} <span className="hidden sm:inline">{isTamil ? c.labelTamil : c.label}</span>
                                <span className="sm:hidden">{isTamil ? c.labelTamil.split(' ')[0] : c.label.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Region World Map */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <span>🗺️</span> {isTamil ? 'உலகளாவிய தரவரிசை' : 'Global Domination'}
                            </h2>
                        </div>
                        {selectedRegion !== 'Global' && (
                            <button
                                onClick={() => setSelectedRegion('Global')}
                                className="px-4 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm border bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                            >
                                🌍 {isTamil ? 'உலகளாவிய நிலை' : 'RESET TO GLOBAL'}
                            </button>
                        )}
                    </div>

                    <WorldMap
                        activeRegion={selectedRegion}
                        onSelectRegion={setSelectedRegion}
                        regionalLeaders={regionalLeaders}
                    />
                </div>

                {/* Content — gated for premium */}
                {isPageLoading ? (
                    <div className="flex flex-col items-center py-20 gap-3">
                        <div className="animate-spin h-9 w-9 border-4 border-purple-400 border-t-transparent rounded-full" />
                        <p className="text-gray-400 font-semibold text-sm">
                            {isTamil ? 'உறுதிப்படுத்துகிறது...' : 'Authenticating...'}
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center py-20 gap-3">
                        <div className="animate-spin h-9 w-9 border-4 border-purple-400 border-t-transparent rounded-full" />
                        <p className="text-gray-400 font-semibold text-sm">
                            {isTamil ? 'ஏற்றுகிறது...' : 'Loading...'}
                        </p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-3">🏝️</div>
                        <p className="text-gray-400 font-semibold">{isTamil ? 'தரவு இல்லை' : 'No data yet — be the first!'}</p>
                    </div>
                ) : (
                    <>
                        {/* 30-Day Trial Banner */}
                        {!isPaid && trialDaysLeft > 0 && (
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-sm text-white px-4 py-3 mb-4 flex items-center justify-between">
                                <span className="text-sm font-semibold">
                                    {isTamil
                                        ? `இலவச சோதனையில் ${trialDaysLeft} நாட்கள் மீதமுள்ளன. தொடர்ந்து பங்கேற்க மேம்படுத்துங்கள்!`
                                        : `${trialDaysLeft} days remaining in your free trial. Upgrade to keep competing!`}
                                </span>
                                <Link href="/" className="px-3 py-1.5 bg-white text-purple-700 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 transition min-w-max ml-2">
                                    {isTamil ? 'மேம்படுத்து' : 'Upgrade'}
                                </Link>
                            </div>
                        )}

                        {/* Podium — top 3 */}
                        {top3.length >= 3 && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-4">
                                <div className="flex items-end justify-center gap-3 sm:gap-6">
                                    {top3.map((entry, i) => (
                                        <PodiumCard key={entry.id} entry={entry} rank={i} isTamil={isTamil} tab={tab} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* My rank pinned card (if outside top 3) */}
                        {myRank >= 3 && user && (
                            <div className="mb-3 rounded-2xl border-2 border-purple-300 bg-purple-50 p-3 sm:p-4 flex items-center gap-3">
                                <div className="w-8 text-center font-black text-purple-500 text-sm">#{myRank + 1}</div>
                                {user.picture ? (
                                    <img src={user.picture} className="h-10 w-10 rounded-full ring-2 ring-purple-400 flex-shrink-0" alt="" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center font-black text-purple-700 flex-shrink-0">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-800 font-bold text-sm truncate">
                                        {user.activeProfileNickname || user.name} <span className="text-purple-400 text-xs font-normal">({isTamil ? 'நீங்கள்' : 'you'})</span>
                                    </div>
                                </div>
                                <div className="text-purple-700 font-black text-sm flex-shrink-0 text-right">
                                    <div>{(entries[myRank][cfg.valueKey] as number).toLocaleString()}</div>
                                    <div className="text-[10px] text-purple-600 uppercase tracking-widest">{isTamil ? cfg.unitTamil : cfg.unit}</div>
                                </div>
                            </div>
                        )}

                        {/* Positions 4+ */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {rest.map((entry, i) => {
                                const rank = i + 4;
                                const value = entry[cfg.valueKey] as number;
                                const isMe = user?.id === entry.id;
                                return (
                                    <div
                                        key={entry.id}
                                        className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 border-b border-gray-50 last:border-0 transition-colors ${isMe ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="w-8 text-center text-gray-400 font-black text-sm flex-shrink-0">#{rank}</div>
                                        <Avatar entry={entry} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-gray-800 font-bold text-sm truncate flex items-center gap-2">
                                                {entry.name}
                                                {isMe && <span className="text-purple-400 text-xs font-normal">({isTamil ? 'நீங்கள்' : 'you'})</span>}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                                                <span>🌍 {entry.region}</span>
                                                {entry.schoolName && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                        <span className="truncate max-w-[100px] sm:max-w-none text-indigo-400" title={entry.schoolName}>🏫 {entry.schoolName}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-gray-700 font-black text-sm">{value.toLocaleString()}</div>
                                            <div className="text-gray-400 text-[10px] uppercase tracking-wider">{isTamil ? cfg.unitTamil : cfg.unit}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Weekly Reset Footer */}
                        {tab === 'weekly' && (
                            <div className="mt-8 mb-12 flex flex-col items-center justify-center text-center space-y-2 border-t border-gray-100 pt-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {isTamil ? 'ஞாயிறு இரவு மீட்டமைக்கப்படும்' : 'Weekly Wipe every Sunday night'}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium max-w-[300px] leading-relaxed">
                                    {isTamil
                                        ? 'அனைத்து வீரர்களுக்கும் சமமான வாய்ப்பை வழங்க, ஒவ்வொரு வாரமும் அனைவருக்கும் புள்ளிகள் மற்றும் தரவரிசை பூஜ்ஜியத்திற்கு மீட்டமைக்கப்படும். புதிய வாரம், புதிய வெற்றியாளர்கள்!'
                                        : 'To keep things fair, everyone\'s Weekly points resets to zero every Sunday at midnight. New week, new champions!'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                isTamil={isTamil}
            />

            <PricingModal
                isOpen={showPricingModal}
                onClose={() => setShowPricingModal(false)}
                isTamil={isTamil}
            />

            <BadgeModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                language={isTamil ? 'tamil' : 'english'}
                celebrationType={null}
            />
        </div>
    );
}
