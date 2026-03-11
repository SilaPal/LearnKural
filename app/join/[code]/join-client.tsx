'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/use-auth';
import AuthModal from '@/components/auth-modal';
import Link from 'next/link';

interface JoinSchoolClientProps {
    inviteCode: string;
}

export default function JoinSchoolClient({ inviteCode }: JoinSchoolClientProps) {
    const router = useRouter();
    const { user, refetch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [error, setError] = useState('');
    const [inviteData, setInviteData] = useState<any>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [childProfiles, setChildProfiles] = useState<any[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [showAddProfile, setShowAddProfile] = useState(false);
    const [newProfileNickname, setNewProfileNickname] = useState('');
    const [newProfileRelationship, setNewProfileRelationship] = useState('Child');
    const [creatingProfile, setCreatingProfile] = useState(false);

    // 1. Validate Invite Link
    useEffect(() => {
        const validateInvite = async () => {
            try {
                const res = await fetch(`/api/schools/invite?code=${inviteCode}`);
                if (res.ok) {
                    const data = await res.json();
                    setInviteData(data);
                } else {
                    const errData = await res.json();
                    setError(errData.error || 'Invalid or expired invite link');
                }
            } catch (err) {
                setError('Network error validating invite.');
            } finally {
                setValidating(false);
            }
        };

        if (inviteCode) {
            validateInvite();
        }
    }, [inviteCode]);

    // 2. Fetch Parent's Child Profiles if logged in
    useEffect(() => {
        const fetchProfiles = async () => {
            if (user && inviteData?.invite?.role === 'student') {
                try {
                    const res = await fetch('/api/child-profiles');
                    if (res.ok) {
                        const data = await res.json();
                        setChildProfiles(data.profiles || []);
                        if (data.profiles && data.profiles.length > 0) {
                            setSelectedProfileId(data.profiles[0].id);
                        }
                    } else if (res.status === 401 || res.status === 403) {
                        // If unauthorized, just keep empty profiles rather than erroring
                        setChildProfiles([]);
                    }
                } catch (err) {
                    console.error('Failed to fetch profiles', err);
                }
            }
        };

        fetchProfiles();
    }, [user, inviteData]);

    const handleAddProfile = async () => {
        if (!newProfileNickname.trim()) return;
        setCreatingProfile(true);
        try {
            const res = await fetch('/api/child-profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: newProfileNickname.trim(),
                    relationship: newProfileRelationship
                })
            });
            const data = await res.json();
            if (res.ok && data.profile) {
                setChildProfiles(prev => [...prev, data.profile]);
                setSelectedProfileId(data.profile.id);
                setNewProfileNickname('');
                setShowAddProfile(false);
            } else {
                setError(data.error || 'Failed to create profile');
            }
        } catch (err) {
            setError('Error creating profile');
        } finally {
            setCreatingProfile(false);
        }
    };

    const handleJoin = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const body: any = { code: inviteCode };
            if (inviteData?.invite?.role === 'student' && selectedProfileId) {
                body.childProfileId = selectedProfileId;
            }

            const res = await fetch('/api/schools/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                await refetch(); // Refresh user state

                // If it was a student invite joined via parent, redirect to classes view
                if (inviteData.invite.role === 'student') {
                    router.push('/dashboard/parent/classes');
                } else {
                    router.push('/dashboard/teacher');
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Network error processing request');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border border-gray-100">
                    <div className="text-6xl mb-6">❌</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Oops!</h2>
                    <p className="text-gray-500 font-medium mb-8 leading-relaxed">{error}</p>
                    <Link href="/" className="inline-block bg-gray-100 text-gray-700 font-bold py-3.5 px-8 rounded-2xl hover:bg-gray-200 transition-all">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const { school, classroom, invite } = inviteData;
    const isStudentJoin = invite.role === 'student';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-16 sm:pt-24 items-center px-4 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-purple-100/50 to-transparent -z-10"></div>
            <div className="absolute top-20 left-10 md:left-32 w-48 h-48 bg-purple-200/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute top-40 right-10 md:right-32 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500"></div>

                <div className="flex justify-center mb-6">
                    {school?.logo ? (
                        <div className="h-20 w-20 rounded-2xl bg-white shadow-md p-1 border border-gray-100">
                            <img src={school.logo} alt={school.name} className="w-full h-full object-contain rounded-xl" />
                        </div>
                    ) : (
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-3xl flex items-center justify-center shadow-inner border border-purple-200">
                            🏫
                        </div>
                    )}
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                        {isStudentJoin ? `Join ${classroom?.name || 'Class'}` : `Join ${school?.name}`}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {isStudentJoin
                            ? `You've been invited to enroll a student in ${school?.name}.`
                            : `You've been invited to join ${school?.name} as a teacher.`}
                    </p>
                </div>

                {/* Profile Selection for Parents */}
                {isStudentJoin && user && (
                    <div className="mb-10 bg-gray-50 p-5 rounded-3xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-4 px-2 tracking-wide uppercase">
                            Which child is joining?
                        </label>
                        {childProfiles.length > 0 ? (
                            <div className="space-y-3">
                                {childProfiles.map(profile => (
                                    <button
                                        key={profile.id}
                                        onClick={() => setSelectedProfileId(profile.id)}
                                        className={`w-full flex items-center p-3 rounded-2xl border-2 transition-all ${selectedProfileId === profile.id
                                            ? 'bg-purple-50 text-purple-700 border-purple-500 shadow-sm'
                                            : 'bg-white text-gray-700 border-transparent hover:border-gray-200 shadow-sm'
                                            }`}
                                    >
                                        <div className="h-10 w-10 bg-white rounded-xl shadow-inner border border-gray-100 flex items-center justify-center text-xl mr-4 overflow-hidden">
                                            {/* In future, link proper lottie avatar representation here. For now, emoji */}
                                            🧒
                                        </div>
                                        <div className="font-bold flex-1 text-left text-lg">{profile.nickname}</div>

                                        <div className={`h-5 w-5 rounded-full border-2 flex flex-shrink-0 items-center justify-center ${selectedProfileId === profile.id ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-transparent'
                                            }`}>
                                            {selectedProfileId === profile.id && <div className="h-2 w-2 bg-white rounded-full"></div>}
                                        </div>
                                    </button>
                                ))}

                                <button
                                    onClick={() => setShowAddProfile(true)}
                                    className="w-full mt-2 flex items-center justify-center p-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all font-bold text-sm"
                                >
                                    + Add another child
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6 px-4 bg-white rounded-2xl shadow-sm border border-gray-100 border-dashed">
                                <div className="text-4xl mb-3">👶</div>
                                <h3 className="text-gray-900 font-bold mb-1">No Child Profiles Found</h3>
                                <p className="text-sm text-gray-500 font-medium mb-4">You need to create a profile for your child before enrolling them.</p>
                                {!showAddProfile ? (
                                    <button
                                        onClick={() => setShowAddProfile(true)}
                                        className="bg-purple-100 text-purple-700 font-bold py-2 px-6 rounded-xl hover:bg-purple-200 transition-colors text-sm"
                                    >
                                        Create Profile
                                    </button>
                                ) : null}
                            </div>
                        )}

                        {showAddProfile && (
                            <div className="mt-4 bg-white border border-purple-100 p-4 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex flex-col gap-4">
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nickname</label>
                                            <input
                                                type="text"
                                                value={newProfileNickname}
                                                onChange={e => setNewProfileNickname(e.target.value)}
                                                placeholder="Enter name"
                                                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Relationship</label>
                                            <select
                                                value={newProfileRelationship}
                                                onChange={e => setNewProfileRelationship(e.target.value)}
                                                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50 font-bold text-gray-700"
                                            >
                                                <option value="child">Child</option>
                                                <option value="sibling">Sibling</option>
                                                <option value="friend">Friend</option>
                                                <option value="spouse">Spouse</option>
                                                <option value="self">Self</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAddProfile}
                                            disabled={creatingProfile || !newProfileNickname.trim()}
                                            className="flex-1 bg-purple-600 text-white font-black py-3 rounded-2xl text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 disabled:opacity-50"
                                        >
                                            {creatingProfile ? 'Creating...' : 'Create & Select'}
                                        </button>
                                        <button
                                            onClick={() => setShowAddProfile(false)}
                                            className="flex-1 bg-gray-100 text-gray-600 font-black py-3 rounded-2xl text-sm hover:bg-gray-200 transition-all font-bold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleJoin}
                    disabled={loading || Boolean(user && isStudentJoin && childProfiles.length === 0 && !showAddProfile)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4.5 px-6 rounded-2xl hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:hover:shadow-none translate-y-0 hover:-translate-y-0.5 active:translate-y-0 text-lg flex justify-center items-center"
                >
                    {loading ? (
                        <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        user ? 'Confirm & Join' : 'Login / Signup to Join'
                    )}
                </button>

                {!user && (
                    <p className="mt-6 text-center text-xs sm:text-sm text-gray-500 font-medium">
                        By continuing, you agree to our Terms of Service and Privacy Policy. New accounts will automatically be linked to this classroom.
                    </p>
                )}
            </div>
        </div>
    );
}
