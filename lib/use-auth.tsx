'use client';

import { useEffect, useState, useCallback } from 'react';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture: string | null;
    tier: 'free' | 'paid';
    createdAt: string;
}

interface UseAuthReturn {
    user: AuthUser | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    refetch: () => void;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            // Prevent Next.js from caching the session check
            const res = await fetch('/api/auth/user', {
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
            });
            if (res.status === 401) {
                setUser(null);
            } else if (res.ok) {
                setUser(await res.json());
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const logout = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
    }, []);

    return { user, isLoading, logout, refetch: fetchUser };
}
