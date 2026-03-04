'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type AvatarEmotion = 'idle' | 'happy' | 'sad' | 'excited' | 'thinking';

// Default durations before returning to idle.
// 'thinking' has no auto-reset — caller must reset manually (e.g. on answer).
const DEFAULT_DURATIONS: Partial<Record<AvatarEmotion, number>> = {
    happy: 2500,
    sad: 2500,
    excited: 5000,
};

/**
 * Centralised hook for the floating ReactingAvatar emotion.
 *
 * Usage:
 *   const { emotion, react } = useAvatarEmotion();
 *   react('happy');          // auto-resets to idle after 2500ms
 *   react('excited');        // auto-resets after 5000ms
 *   react('thinking');       // stays until you call react('idle')
 *   react('happy', 4000);    // override duration
 */
export function useAvatarEmotion(defaultEmotion: AvatarEmotion = 'idle') {
    const [emotion, setEmotion] = useState<AvatarEmotion>(defaultEmotion);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear any pending reset before setting a new emotion
    const react = useCallback((nextEmotion: AvatarEmotion, duration?: number) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setEmotion(nextEmotion);

        // Auto-reset to idle after duration (unless it's already idle or thinking)
        if (nextEmotion !== 'idle' && nextEmotion !== 'thinking') {
            const ms = duration ?? DEFAULT_DURATIONS[nextEmotion] ?? 2500;
            timerRef.current = setTimeout(() => {
                setEmotion('idle');
                timerRef.current = null;
            }, ms);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { emotion, react };
}
