'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Profile {
    id: string;
    nickname: string;
    relationship: string;
}

interface InviteData {
    schoolId: string;
    schoolName: string;
    classroomId?: string;
    classroomName?: string;
    role: string;
}

interface JoinClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    isTamil: boolean;
    profiles: Profile[];
    userId: string;
    userName: string;
}

export default function JoinClassModal({
    isOpen,
    onClose,
    isTamil,
    profiles,
    userId,
    userName,
}: JoinClassModalProps) {
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [inviteData, setInviteData] = useState<InviteData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [selectedProfileId, setSelectedProfileId] = useState<string | 'me' | 'new'>('me');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newProfileName, setNewProfileName] = useState('');
    const [newRelationship, setNewRelationship] = useState('child');

    // Clear state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setInviteCode('');
            setInviteData(null);
            setError(null);
            setSelectedProfileId('me');
            setNewProfileName('');
            setNewRelationship('child');
        }
    }, [isOpen]);

    const handleSearchCode = async () => {
        if (!inviteCode.trim()) return;
        setIsSearching(true);
        setError(null);
        setInviteData(null);

        try {
            const res = await fetch(`/api/schools/invite/${inviteCode.trim().toUpperCase()}`);
            const data = await res.json();

            if (res.ok) {
                setInviteData(data);
            } else {
                setError(data.error || (isTamil ? 'குறியீடு செல்லாது' : 'Invalid invite code'));
            }
        } catch (err) {
            setError(isTamil ? 'பிழை ஏற்பட்டது' : 'An error occurred');
        } finally {
            setIsSearching(false);
        }
    };

    const handleJoin = async () => {
        if (!inviteData) return;
        setIsSubmitting(true);
        setError(null);

        try {
            let finalProfileId: string | null = null;

            // 1. If 'Me' selected, profileId remains null (joins as parent/self)
            // 2. If 'New' selected, create profile first
            if (selectedProfileId === 'new') {
                if (!newProfileName.trim()) {
                    setError(isTamil ? 'பெயர் தேவை' : 'Name is required');
                    setIsSubmitting(false);
                    return;
                }
                const createRes = await fetch('/api/child-profiles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nickname: newProfileName.trim(),
                        relationship: newRelationship
                    })
                });
                const createData = await createRes.json();
                if (!createRes.ok) throw new Error(createData.error);
                finalProfileId = createData.profile.id;
            } else if (selectedProfileId !== 'me') {
                finalProfileId = selectedProfileId;
            }

            // 2. Formally join the class
            const joinRes = await fetch('/api/schools/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: inviteCode.trim().toUpperCase(),
                    childProfileId: finalProfileId
                })
            });
            const joinData = await joinRes.json();

            if (joinRes.ok) {
                // Success! Reload or go to dashboard
                onClose();
                router.push('/');
                window.location.reload();
            } else {
                setError(joinData.error || (isTamil ? 'சேர முடியவில்லை' : 'Failed to join'));
            }
        } catch (err: any) {
            setError(err.message || (isTamil ? 'பிழை ஏற்பட்டது' : 'An error occurred'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-500 px-6 py-6 text-white">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold tracking-tight">
                            {isTamil ? 'வகுப்பில் சேர' : 'Join a Class'}
                        </h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-indigo-100 text-sm mt-1 opacity-90">
                        {isTamil ? 'உங்கள் ஆசிரியர் பகிர்ந்த குறியீட்டை உள்ளிடவும்' : 'Enter the code shared by your teacher'}
                    </p>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Invite Code Input */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                placeholder={isTamil ? 'குறியீடு (எ.கா. ABC123)' : 'Code (e.g. ABC123)'}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-400 focus:outline-none font-mono text-lg tracking-widest text-gray-800 placeholder:text-gray-300 transition-all"
                                disabled={isSearching || !!inviteData}
                            />
                            {inviteData && (
                                <button
                                    onClick={() => setInviteData(null)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs"
                                >
                                    {isTamil ? 'மாற்று' : 'Edit'}
                                </button>
                            )}
                        </div>
                        {!inviteData && (
                            <button
                                onClick={handleSearchCode}
                                disabled={isSearching || !inviteCode.trim()}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                            >
                                {isSearching ? '...' : (isTamil ? 'தேடு' : 'Find')}
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {/* School Preview Section */}
                    {inviteData && (
                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-inner">
                                    🏛️
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{inviteData.schoolName}</h3>
                                    {inviteData.classroomName && (
                                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-0.5">
                                            {inviteData.classroomName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Profile Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-600 px-1">
                                    {isTamil ? 'யார் சேருகிறார்கள்?' : 'Who is joining?'}
                                </label>

                                <div className="grid grid-cols-1 gap-2">
                                    {/* Current Account / Parent */}
                                    <button
                                        onClick={() => setSelectedProfileId('me')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedProfileId === 'me' ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">{isTamil ? 'நான் (பெரியவர்)' : `Me (${userName})`}</span>
                                        {selectedProfileId === 'me' && <span className="ml-auto text-indigo-600">●</span>}
                                    </button>

                                    {/* Existing Sub-profiles */}
                                    {profiles.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedProfileId(p.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedProfileId === p.id ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
                                                {p.nickname.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col items-start translate-y-[-1px]">
                                                <span className="font-bold text-gray-700 text-sm">{p.nickname}</span>
                                                <span className="text-[10px] text-gray-400 capitalize">{p.relationship}</span>
                                            </div>
                                            {selectedProfileId === p.id && <span className="ml-auto text-indigo-600">●</span>}
                                        </button>
                                    ))}

                                    {/* Add New Option */}
                                    <button
                                        onClick={() => setSelectedProfileId('new')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${selectedProfileId === 'new' ? 'border-green-500 bg-green-50/50' : 'border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold">
                                            +
                                        </div>
                                        <span className="font-bold text-sm">{isTamil ? 'புதிய மாணவரைச் சேர்க்கவும்' : 'Add a new student'}</span>
                                    </button>
                                </div>

                                {/* Inline Creation Fields */}
                                {selectedProfileId === 'new' && (
                                    <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 space-y-4 pt-4 mt-2 animate-in slide-in-from-top-4 duration-300">
                                        <div>
                                            <label className="text-[10px] font-bold text-green-700 uppercase tracking-widest block mb-1 px-1">
                                                {isTamil ? 'மாணவர் பெயர்' : 'Student Name'}
                                            </label>
                                            <input
                                                type="text"
                                                value={newProfileName}
                                                onChange={(e) => setNewProfileName(e.target.value)}
                                                placeholder="..."
                                                className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-green-700 uppercase tracking-widest block mb-1 px-1">
                                                {isTamil ? 'உறவுமுறை' : 'Relationship'}
                                            </label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['child', 'friend', 'sibling', 'spouse', 'other'].map(rel => (
                                                    <button
                                                        key={rel}
                                                        onClick={() => setNewRelationship(rel)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${newRelationship === rel ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'bg-white border-green-200 text-green-600 hover:bg-green-100'}`}
                                                    >
                                                        {isTamil ? (
                                                            rel === 'child' ? 'குழந்தை' :
                                                                rel === 'friend' ? 'நண்பர்' :
                                                                    rel === 'sibling' ? 'சகோதரன்/சகோதரி' :
                                                                        rel === 'spouse' ? 'துணைவர்' :
                                                                            'மற்றவை'
                                                        ) : rel}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Final Confirm Button */}
                            <button
                                onClick={handleJoin}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-200 text-lg active:scale-95"
                            >
                                {isSubmitting ? '...' : (isTamil ? 'உறுதி செய்து சேரவும்' : 'Confirm & Join')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
