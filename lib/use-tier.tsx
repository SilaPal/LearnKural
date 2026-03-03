'use client';

import { useAuth } from '@/lib/use-auth';

export type UserTier = 'free' | 'paid';

export function useUserTier(): {
    tier: UserTier;
    isPaid: boolean;
    isLoading: boolean;
    trialDaysLeft: number;
    isTrialExpired: boolean;
} {
    const { user, isLoading } = useAuth();
    const tier: UserTier = user?.tier ?? 'free';

    const trialDaysLeft = user?.createdAt
        ? 30 - Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 30;

    const isTrialExpired = !!user && tier !== 'paid' && trialDaysLeft <= 0;

    return {
        tier,
        isPaid: tier === 'paid',
        isLoading,
        trialDaysLeft,
        isTrialExpired
    };
}
