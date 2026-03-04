'use client';

import { useEffect, useState } from 'react';
import type { Badge } from '@/lib/badge-system';

interface BadgeEarnedToastProps {
    badge: Badge;
    isTamil: boolean;
    onDismiss: () => void;
    onViewAchievements: () => void;
}

const SPARKLES = ['✨', '⭐', '🌟', '💫', '🎉', '🎊', '🌈'];

export function BadgeEarnedToast({ badge, isTamil, onDismiss, onViewAchievements }: BadgeEarnedToastProps) {
    const [visible, setVisible] = useState(false);
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; char: string; delay: number }[]>([]);

    useEffect(() => {
        // Animate in
        const t = setTimeout(() => setVisible(true), 50);

        // Generate floating particles
        const ps = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            char: SPARKLES[Math.floor(Math.random() * SPARKLES.length)],
            delay: Math.random() * 1.5,
        }));
        setParticles(ps);

        // Auto-dismiss after 6 seconds
        const dismiss = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 400);
        }, 6000);

        return () => { clearTimeout(t); clearTimeout(dismiss); };
    }, [onDismiss]);

    const tierColors: Record<string, string> = {
        diamond: 'from-cyan-400 via-blue-500 to-purple-600',
        gold: 'from-yellow-400 via-orange-400 to-pink-500',
        silver: 'from-slate-400 via-gray-300 to-slate-500',
        bronze: 'from-orange-500 via-amber-400 to-yellow-500',
    };
    const gradient = tierColors[badge.tier || 'bronze'] ?? tierColors.bronze;

    return (
        <div
            className={`fixed bottom-24 left-1/2 z-[9999] transition-all duration-500 ease-out pointer-events-none
        ${visible ? '-translate-x-1/2 translate-y-0 opacity-100 scale-100' : '-translate-x-1/2 translate-y-8 opacity-0 scale-90'}`}
            style={{ width: 'min(340px, 92vw)' }}
        >
            {/* Floating sparkle particles */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {particles.map(p => (
                    <span
                        key={p.id}
                        className="absolute text-xl animate-ping"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            animationDelay: `${p.delay}s`,
                            animationDuration: '1.5s',
                            opacity: 0.7,
                        }}
                    >
                        {p.char}
                    </span>
                ))}
            </div>

            {/* Main card */}
            <div className={`relative rounded-3xl bg-gradient-to-br ${gradient} p-1 shadow-2xl`}
                style={{ boxShadow: '0 0 40px rgba(255,200,0,0.5), 0 20px 60px rgba(0,0,0,0.4)' }}>
                <div className="relative rounded-[22px] bg-gray-950/90 backdrop-blur-md overflow-hidden pointer-events-auto">

                    {/* Shimmer overlay */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
                            backgroundSize: '200% 200%',
                            animation: 'shimmer 2s linear infinite',
                        }}
                    />

                    <div className="relative px-5 py-4 flex items-center gap-4">
                        {/* Badge icon with glow */}
                        <div className="relative flex-shrink-0">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl animate-bounce"
                                style={{
                                    background: `linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))`,
                                    boxShadow: '0 0 20px rgba(255,200,0,0.6)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                }}
                            >
                                {badge.icon}
                            </div>
                            <span
                                className="absolute -top-1.5 -right-1.5 text-xl animate-spin"
                                style={{ animationDuration: '3s' }}
                            >
                                ✨
                            </span>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-0.5">
                                {isTamil ? '🎊 புதிய பேட்ஜ் கிடைத்தது!' : '🎊 New Badge Unlocked!'}
                            </p>
                            <p className="text-white font-black text-lg leading-tight truncate">
                                {isTamil ? badge.nameTamil : badge.name}
                            </p>
                            <p className="text-gray-400 text-xs mt-0.5 leading-snug line-clamp-1">
                                {isTamil ? badge.descriptionTamil : badge.description}
                            </p>
                        </div>

                        {/* Dismiss X */}
                        <button
                            onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white text-xs transition"
                            aria-label="Dismiss"
                        >
                            ✕
                        </button>
                    </div>

                    {/* CTA button */}
                    <button
                        onClick={() => { onViewAchievements(); onDismiss(); }}
                        className={`w-full py-2.5 text-center text-sm font-black tracking-wide text-white bg-gradient-to-r ${gradient} hover:opacity-90 transition-opacity`}
                    >
                        {isTamil ? '🏅 சாதனைகளை பார்க்க →' : '🏅 View Achievements →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
