'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/use-auth';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface AvatarItem {
    id: string;
    name: string;
    imageUrl: string;
    type: 'static' | 'lottie';
    metadata: {
        idle: string;
        happy: string;
        excited: string;
        sad: string;
        thinking: string;
    } | null;
}

interface ReactingAvatarProps {
    emotion: 'idle' | 'happy' | 'sad' | 'excited' | 'thinking';
    /** If provided, overrides the self-managed fixed position (e.g. for inline badge display) */
    className?: string;
    /** Unique key for localStorage position persistence. Defaults to 'avatar-pos' */
    posKey?: string;
    /** Whether to show the dismiss (X) button. Defaults to true. */
    showDismiss?: boolean;
}

const EMOTIONS = ['idle', 'happy', 'sad', 'excited', 'thinking'] as const;
const FADE_MS = 800;
const DEBOUNCE_MS = 150;
const SIZE_PX = 96; // desktop size for clamping

function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
}

export default function ReactingAvatar({ emotion, className, posKey = 'tamili-avatar-pos', showDismiss = true }: ReactingAvatarProps) {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [activeAvatar, setActiveAvatar] = useState<AvatarItem | null>(null);
    const [loading, setLoading] = useState(true);

    // Must be first effect — prevents any localStorage/window access during SSR
    useEffect(() => { setMounted(true); }, []);

    // Emotion cross-fade
    const [displayEmotion, setDisplayEmotion] = useState<typeof EMOTIONS[number]>('idle');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Drag state
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const avatarRef = useRef<HTMLDivElement>(null);

    // Load saved position from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(posKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                setPos(parsed);
            } else {
                // Default: bottom-left
                setPos({ x: 24, y: window.innerHeight - SIZE_PX - 24 });
            }
        } catch {
            setPos({ x: 24, y: window.innerHeight - SIZE_PX - 24 });
        }
    }, [posKey]);

    // Re-clamp position when the viewport resizes (e.g. phone rotation, window resize)
    useEffect(() => {
        const onResize = () => {
            setPos(prev => {
                if (!prev) return prev;
                const newX = clamp(prev.x, 0, window.innerWidth - SIZE_PX);
                const newY = clamp(prev.y, 0, window.innerHeight - SIZE_PX);
                // Only update (and re-save) if position actually changed
                if (newX !== prev.x || newY !== prev.y) {
                    const clamped = { x: newX, y: newY };
                    try { localStorage.setItem(posKey, JSON.stringify(clamped)); } catch { /* ignore */ }
                    return clamped;
                }
                return prev;
            });
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [posKey]);

    // Debounced emotion
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDisplayEmotion(emotion), DEBOUNCE_MS);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [emotion]);

    // Fetch active avatar
    useEffect(() => {
        if (user) {
            fetch('/api/user/avatar')
                .then(res => res.json())
                .then(data => {
                    if (data?.activeAvatarId && data.activeAvatarId !== 'none' && data.activeAvatarId !== null) {
                        fetch('/api/sandhai')
                            .then(r => r.json())
                            .then(sandhai => {
                                const av = sandhai.catalog.find((a: AvatarItem) => a.id === data.activeAvatarId);
                                if (av) setActiveAvatar(av);
                            });
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    // --- Drag handlers ---
    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if (!pos) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = true;
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    }, [pos]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging.current) return;
        const newX = clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth - SIZE_PX);
        const newY = clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - SIZE_PX);
        setPos({ x: newX, y: newY });
    }, []);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        if (!dragging.current || !pos) return;
        dragging.current = false;
        try { localStorage.setItem(posKey, JSON.stringify(pos)); } catch { /* ignore */ }
    }, [pos, posKey]);

    // Dismiss handler
    const handleDismiss = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await fetch('/api/user/avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarId: 'none' }),
            });
            if (res.ok) setActiveAvatar(null);
        } catch (err) { console.error(err); }
    };

    if (!mounted || !user || loading || !activeAvatar || pos === null) return null;

    // If className is explicitly given, render inline (e.g. for Sandhai preview or BadgeModal)
    if (className !== undefined) {
        return <InlineAvatar activeAvatar={activeAvatar} displayEmotion={displayEmotion} className={className} onDismiss={handleDismiss} showDismiss={showDismiss} />;
    }

    const size = 96; // px, desktop

    return (
        <div
            ref={avatarRef}
            style={{ left: pos.x, top: pos.y, width: size, height: size }}
            className="fixed z-[9990] group/avatar select-none touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
        >
            {/* Grab cursor hint */}
            <div className="absolute inset-0 rounded-full cursor-grab active:cursor-grabbing" />

            {/* Dismiss Button */}
            {showDismiss && (
                <button
                    onClick={handleDismiss}
                    onPointerDown={e => e.stopPropagation()}
                    className="absolute -top-1 -right-1 z-50 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity hover:scale-110"
                    title="Dismiss Avatar"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            )}

            {/* 3D Sphere container */}
            <div
                className="w-full h-full rounded-full overflow-hidden relative"
                style={{
                    // Multi-layer box shadow for 3D depth
                    boxShadow: [
                        'inset -4px -6px 12px rgba(0,0,0,0.25)',   // inner darkness (bottom-right)
                        'inset 4px 4px 10px rgba(255,255,255,0.5)', // inner highlight (top-left)
                        '0 8px 24px rgba(0,0,0,0.30)',              // drop shadow
                        '0 2px 6px rgba(0,0,0,0.15)',               // tight base shadow
                    ].join(', '),
                    background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7) 0%, rgba(255,200,100,0.15) 40%, transparent 70%)',
                    border: '2px solid rgba(255,200,100,0.4)',
                }}
            >
                {/* Lottie tracks - Optimized to only mount the active emotion */}
                {activeAvatar.type === 'lottie' ? (
                    <div className="relative w-full h-full">
                        {(() => {
                            const src = activeAvatar.metadata?.[displayEmotion] || activeAvatar.metadata?.idle;
                            if (!src) return null;
                            return (
                                <div
                                    key={displayEmotion} // Forces unmount/remount on emotion change
                                    className="absolute inset-0 animate-in fade-in duration-500"
                                >
                                    <DotLottieReact src={src} loop autoplay style={{ width: '100%', height: '100%' }} />
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className={`w-full h-full flex items-center justify-center text-4xl ${displayEmotion === 'happy' || displayEmotion === 'excited' ? 'animate-bounce' : displayEmotion === 'sad' ? 'grayscale' : ''}`}>
                        {activeAvatar.imageUrl || '🧒'}
                    </div>
                )}

                {/* Glossy sphere highlight (top-left crescent) */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: '6%', left: '10%',
                        width: '45%', height: '35%',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.65) 0%, transparent 70%)',
                        filter: 'blur(2px)',
                        zIndex: 10,
                    }}
                />
            </div>

            {/* Drag hint on hover */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover/avatar:opacity-70 transition-opacity text-[9px] text-gray-400 whitespace-nowrap pointer-events-none font-medium">
                drag me
            </div>
        </div>
    );
}

// Inline variant for Sandhai/BadgeModal usage (no drag, no fixed position)
function InlineAvatar({
    activeAvatar, displayEmotion, className, onDismiss, showDismiss = true
}: {
    activeAvatar: AvatarItem;
    displayEmotion: typeof EMOTIONS[number];
    className: string;
    onDismiss: (e: React.MouseEvent) => void;
    showDismiss?: boolean;
}) {
    return (
        <div className={`relative inline-block aspect-square group/avatar ${className}`}>
            {showDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute -top-1 -right-1 z-50 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity hover:scale-110"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            )}
            <div className="w-full h-full rounded-full overflow-hidden relative"
                style={{
                    boxShadow: [
                        'inset -4px -6px 12px rgba(0,0,0,0.25)',
                        'inset 4px 4px 10px rgba(255,255,255,0.5)',
                        '0 8px 24px rgba(0,0,0,0.30)',
                    ].join(', '),
                    background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7) 0%, rgba(255,200,100,0.15) 40%, transparent 70%)',
                    border: '2px solid rgba(255,200,100,0.4)',
                }}
            >
                {/* Lottie tracks - Optimized to only mount the active emotion */}
                {activeAvatar.type === 'lottie' ? (
                    <div className="relative w-full h-full">
                        {(() => {
                            const src = activeAvatar.metadata?.[displayEmotion] || activeAvatar.metadata?.idle;
                            if (!src) return null;
                            return (
                                <div
                                    key={displayEmotion} // Forces unmount/remount on emotion change
                                    className="absolute inset-0 animate-in fade-in duration-500"
                                >
                                    <DotLottieReact src={src} loop autoplay style={{ width: '100%', height: '100%' }} />
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{activeAvatar.imageUrl || '🧒'}</div>
                )}
                <div className="absolute pointer-events-none" style={{ top: '6%', left: '10%', width: '45%', height: '35%', borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.65) 0%, transparent 70%)', filter: 'blur(2px)', zIndex: 10 }} />
            </div>
        </div>
    );
}
