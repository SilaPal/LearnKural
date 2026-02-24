'use client';

import { useAuth } from '@/lib/use-auth';

export type UserTier = 'free' | 'paid';

export function useUserTier(): { tier: UserTier; isPaid: boolean; isLoading: boolean } {
    const { user, isLoading } = useAuth();
    const tier: UserTier = user?.tier ?? 'free';
    return { tier, isPaid: tier === 'paid', isLoading };
}
