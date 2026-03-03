'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WaitlistEntry {
    email: string;
    createdAt: string;
    userName: string | null;
    userTier: string | null;
}

export default function WaitlistClient() {
    const { user, isLoading: authLoading } = useAuth();
    const [list, setList] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const ADMIN_EMAIL = 'anu.ganesan@gmail.com';

    useEffect(() => {
        if (!authLoading && (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
            router.push('/');
            return;
        }

        if (user) {
            fetch('/api/admin/waitlist')
                .then(res => {
                    if (!res.ok) throw new Error('Unauthorized or Server Error');
                    return res.json();
                })
                .then(data => {
                    setList(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full shadow-lg"></div>
                    <p className="text-indigo-900 font-bold animate-pulse">Accessing Admin Records...</p>
                </div>
            </div>
        );
    }

    if (error || !user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="text-6xl mb-6">🚫</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Restricted Access</h1>
                <p className="text-gray-600 mb-8">This page is reserved for system administrators.</p>
                <Link href="/" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-700 transition">
                    Return to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition">
                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Premium Waitlist</h1>
                            <p className="text-xs text-indigo-600 font-semibold tracking-wider uppercase">Admin Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                            <p className="text-sm font-bold text-indigo-900">{user.name}</p>
                        </div>
                        {user.picture && <img src={user.picture} className="h-10 w-10 rounded-full border-2 border-white shadow-sm" />}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Interested Users</p>
                        <h2 className="text-4xl font-black text-gray-900">{list.length}</h2>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Recent Signups (Last 7 Days)</p>
                        <h2 className="text-4xl font-black text-indigo-600">
                            {list.filter(e => new Date(e.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                        </h2>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Conversion Potential</p>
                        <h2 className="text-4xl font-black text-amber-500">High</h2>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            User Records
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">{list.length}</span>
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-8 py-4">User</th>
                                    <th className="px-8 py-4">Email Address</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Joined Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {list.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                    {entry.userName?.charAt(0) || entry.email.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-900">{entry.userName || 'Guest User'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-gray-600 font-medium">{entry.email}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${entry.userTier === 'paid'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {entry.userTier === 'paid' ? 'PREMIUM' : 'FREE USER'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-gray-900 font-bold text-sm">
                                                {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                {new Date(entry.createdAt).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {list.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="text-4xl mb-4">🧊</div>
                                            <p className="text-gray-400 font-bold">The waitlist is currently empty.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
