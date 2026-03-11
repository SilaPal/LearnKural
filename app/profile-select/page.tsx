'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/use-auth';

interface ChildProfile {
    id: string;
    nickname: string;
    activeAvatarId: string;
    coins: number;
    badges: unknown[];
}

export default function ProfileSelectPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [profiles, setProfiles] = useState<ChildProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const [relationship, setRelationship] = useState('child');
    const [adding, setAdding] = useState(false);
    const [switching, setSwitching] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetch('/api/child-profiles')
            .then(r => r.json())
            .then(d => { setProfiles(d.profiles || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [user]);

    const handleSelect = async (profileId: string) => {
        setSwitching(profileId);
        await fetch('/api/child-profiles/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId }),
        });
        router.push('/');
    };

    const handlePlayAsParent = async () => {
        setSwitching('parent');
        await fetch('/api/child-profiles/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId: null }),
        });
        router.push('/');
    };

    const handleAdd = async () => {
        if (!newNickname.trim()) return;
        setAdding(true);
        const res = await fetch('/api/child-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nickname: newNickname.trim(),
                relationship
            }),
        });
        const data = await res.json();
        if (data.profile) {
            setProfiles(prev => [...prev, data.profile]);
            setNewNickname('');
            setShowAdd(false);
        }
        setAdding(false);
    };

    if (!user) return null;

    const avatarEmoji: Record<string, string> = {
        default: '🍌',
        lottie_arun: '🧘',
        lottie_parrot: '🦜',
        lottie_stickman: '🏃',
        lottie_stickgirl: '🏃‍♀️',
        lottie_nila: '👩',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center px-4">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="text-5xl mb-3">🌟</div>
                <h1 className="text-3xl font-bold text-gray-800">Who's playing today?</h1>
                <p className="text-gray-500 mt-1 text-sm">Select a profile to start learning</p>
            </div>

            {loading ? (
                <div className="text-orange-400 animate-pulse text-lg">Loading profiles...</div>
            ) : (
                <div className="flex flex-wrap justify-center gap-5 max-w-xl">
                    {/* Child profiles */}
                    {profiles.map(profile => (
                        <button
                            key={profile.id}
                            onClick={() => handleSelect(profile.id)}
                            disabled={!!switching}
                            className="flex flex-col items-center gap-3 bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-orange-400 hover:scale-105 transition-all duration-200 active:scale-95 w-36 relative"
                        >
                            {switching === profile.id && (
                                <div className="absolute inset-0 bg-white/70 rounded-3xl flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {/* Avatar circle — empty placeholder if no avatar or expired */}
                            {profile.activeAvatarId === 'none' ? (
                                <a
                                    href={`/sandhai?for=${profile.id}&nickname=${encodeURIComponent(profile.nickname)}`}
                                    onClick={e => e.stopPropagation()}
                                    title="Pick an avatar from the shop"
                                    className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors group"
                                >
                                    <span className="text-2xl">🎨</span>
                                    <span className="text-[9px] font-semibold leading-tight text-center mt-0.5 group-hover:text-orange-500">Pick Avatar</span>
                                </a>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-5xl shadow-inner overflow-hidden">
                                    {(profile as any).avatarThumbnail ? (
                                        <img src={(profile as any).avatarThumbnail} alt={profile.nickname} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{avatarEmoji[profile.activeAvatarId] || '🍌'}</span>
                                    )}
                                </div>
                            )}
                            <span className="font-bold text-gray-800 text-base">{profile.nickname}</span>
                            <div className="flex gap-2 text-xs text-gray-400">
                                <span>🪙 {profile.coins || 0}</span>
                                <span>🏅 {(profile.badges as unknown[] | undefined)?.length || 0}</span>
                            </div>
                            {/* Show Change Avatar for all users (free = 30d, premium = unlimited) */}
                            {profile.activeAvatarId !== 'none' && (
                                <a
                                    href={`/sandhai?for=${profile.id}&nickname=${encodeURIComponent(profile.nickname)}`}
                                    onClick={e => e.stopPropagation()}
                                    className="text-[10px] text-orange-400 hover:text-orange-600 font-semibold mt-1 underline"
                                >
                                    🎨 Change Avatar
                                </a>
                            )}
                        </button>
                    ))}

                    {/* Play as yourself — unified card style */}
                    <button
                        key="parent"
                        onClick={handlePlayAsParent}
                        disabled={!!switching}
                        className="flex flex-col items-center gap-3 bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-purple-400 hover:scale-105 transition-all duration-200 active:scale-95 w-36 relative"
                    >
                        {switching === 'parent' && (
                            <div className="absolute inset-0 bg-white/70 rounded-3xl flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center text-5xl shadow-inner overflow-hidden">
                            {user.picture ? (
                                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{avatarEmoji[user.activeAvatarId] || '👤'}</span>
                            )}
                        </div>
                        <span className="font-bold text-gray-800 text-base">{user.name}</span>
                        <div className="flex gap-2 text-xs text-purple-400">
                            <span>🪙 {user.coins}</span>
                            <span>🏅 {user.badgeCount}</span>
                        </div>
                        <a
                            href="/sandhai"
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] text-purple-400 hover:text-purple-600 font-semibold mt-1 underline"
                        >
                            🎨 Change Avatar
                        </a>
                    </button>

                    {/* Add child button */}
                    {!showAdd ? (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="flex flex-col items-center gap-3 bg-white/60 rounded-3xl p-6 border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-white hover:scale-105 transition-all duration-200 w-36"
                        >
                            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-4xl text-orange-400">+</div>
                            <span className="font-bold text-orange-500 text-sm">Add Profile</span>
                        </button>
                    ) : (
                        <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-orange-400 w-48 flex flex-col gap-3">
                            <input
                                autoFocus
                                value={newNickname}
                                onChange={e => setNewNickname(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                placeholder="Nickname"
                                maxLength={20}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-orange-400 w-full font-bold"
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Relation</label>
                                <select
                                    value={relationship}
                                    onChange={e => setRelationship(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-orange-400 w-full bg-gray-50 font-bold text-gray-700"
                                >
                                    <option value="child">Child</option>
                                    <option value="sibling">Sibling</option>
                                    <option value="friend">Friend</option>
                                    <option value="spouse">Spouse</option>
                                    <option value="self">Self</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={adding || !newNickname.trim()}
                                className="bg-orange-500 text-white rounded-xl py-2 text-sm font-black hover:bg-orange-600 disabled:opacity-50 transition active:scale-95 shadow-md shadow-orange-100"
                            >
                                {adding ? '...' : 'Add Profile'}
                            </button>
                            <button onClick={() => { setShowAdd(false); setNewNickname(''); setRelationship('child'); }} className="text-gray-400 text-xs font-bold hover:text-gray-600">Cancel</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
