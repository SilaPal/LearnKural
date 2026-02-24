'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';

interface LeaderboardEntry {
    id: string;
    name: string;
    picture: string | null;
    coins: number;
    activeAvatarId: string;
    avatarImageUrl: string | null;
    region: string;
}

const REGIONS = [
    'Global',
    'North America',
    'Europe',
    'India',
    'Sri Lanka',
    'Singapore',
    'Malaysia',
    'Australia',
    'Middle East',
    'Other'
];

export default function LeaderboardClient() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [selectedRegion, setSelectedRegion] = useState('Global');
    const [loading, setLoading] = useState(true);
    const [isTamil, setIsTamil] = useState(false);
    const [myRank, setMyRank] = useState<number | null>(null);

    useEffect(() => {
        const savedLang = localStorage.getItem('thirukural-language');
        if (savedLang === 'tamil') setIsTamil(true);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/leaderboard?region=${selectedRegion}`)
            .then(res => res.json())
            .then(data => {
                setEntries(data);
                if (user) {
                    const rank = data.findIndex((e: LeaderboardEntry) => e.id === user.id);
                    setMyRank(rank !== -1 ? rank + 1 : null);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedRegion, user]);

    const handleUpdateRegion = async (region: string) => {
        if (!user) return;
        try {
            // We need an API to update the user's region.
            // For now, let's assume we can POST to /api/user/profile or similar.
            // Since we haven't built that, let's create a quick route or add it to users API.
            // Let's create /api/user/region for this.
            const res = await fetch('/api/user/region', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region })
            });
            if (res.ok) {
                setSelectedRegion(region);
                // Refresh is triggered by setting selectedRegion if it changed
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-indigo-50 pb-20 font-sans">
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-8 shadow-lg">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/" className="p-2 hover:bg-white/20 rounded-full transition">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </Link>
                        <h1 className="text-3xl font-black tracking-tight">
                            {isTamil ? 'தலைமுறைப் பட்டியல்' : 'Leaderboard'} 🏆
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {REGIONS.map(r => (
                            <button
                                key={r}
                                onClick={() => setSelectedRegion(r)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedRegion === r
                                        ? 'bg-white text-indigo-700 shadow-md scale-105'
                                        : 'bg-indigo-500/30 text-indigo-100 hover:bg-indigo-500/50'
                                    }`}
                            >
                                {r === 'Global' ? (isTamil ? 'உலகளாவிய' : 'Global') : r}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {user && (
                    <div className="mb-8 bg-white rounded-3xl p-6 shadow-xl border-4 border-indigo-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                                {user.activeAvatarId === 'default' ? '🧒' : '🎭'}
                                {/* Note: we can't easily show the emoji here without fetching catalog, 
                                    but it's fine for now as a placeholder or we can use the picture */}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800">{user.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                                        {selectedRegion}
                                    </span>
                                    {selectedRegion !== 'Global' && (
                                        <button
                                            onClick={() => {
                                                const nextRegion = prompt(isTamil ? 'உங்கள் பிராந்தியத்தைத் தேர்ந்தெடுக்கவும்:' : 'Select your region:', selectedRegion);
                                                if (nextRegion && REGIONS.includes(nextRegion)) handleUpdateRegion(nextRegion);
                                            }}
                                            className="text-xs font-bold text-gray-400 hover:text-indigo-600 underline"
                                        >
                                            {isTamil ? 'மாற்று' : 'Change'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                {isTamil ? 'உங்கள் தரம்' : 'Your Rank'}
                            </div>
                            <div className="text-4xl font-black text-indigo-700">
                                # {myRank || '100+'}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-indigo-600 font-bold">{isTamil ? 'ஏற்றுகிறது...' : 'Loading Champions...'}</p>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="p-20 text-center text-gray-400 font-bold">
                            {isTamil ? 'தரவு எதுவும் இல்லை' : 'No data yet in this region'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {entries.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className={`p-4 sm:p-6 flex items-center gap-4 transition-colors hover:bg-indigo-50/50 ${user?.id === entry.id ? 'bg-indigo-50 font-bold' : ''
                                        }`}
                                >
                                    <div className="w-12 text-center text-xl font-black text-gray-400">
                                        {index === 0 && <span className="text-3xl">🥇</span>}
                                        {index === 1 && <span className="text-3xl">🥈</span>}
                                        {index === 2 && <span className="text-3xl">🥉</span>}
                                        {index > 2 && `#${index + 1}`}
                                    </div>

                                    <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl shadow-sm overflow-hidden flex-shrink-0">
                                        {entry.avatarImageUrl || '🧒'}
                                    </div>

                                    <div className="flex-grow">
                                        <div className="text-lg font-bold text-gray-800 line-clamp-1">{entry.name}</div>
                                        <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                            <span>🌍 {entry.region}</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl font-black text-orange-600 flex items-center gap-1 justify-end">
                                            <span>🪙</span>
                                            {entry.coins}
                                        </div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                            {isTamil ? 'நாணயங்கள்' : 'Total Coins'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
