'use client';

import { useUserTier } from '@/lib/use-tier';
import { FEATURES } from '@/lib/features';

interface FeatureGateProps {
    featureId: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    isTamil?: boolean;
}

/**
 * Renders children if the user's tier meets the feature requirement.
 * For paid-only features shown to free users, renders a paywall card.
 *
 * Usage:
 *   <FeatureGate featureId="AI_TUTOR">
 *     <AiTutorComponent />
 *   </FeatureGate>
 */
export function FeatureGate({ featureId, children, fallback, isTamil = false }: FeatureGateProps) {
    const { isPaid, isLoading } = useUserTier();
    const feature = FEATURES[featureId];

    if (!feature) return null;
    if (feature.tier === 'all') return <>{children}</>;
    if (isLoading) return null;
    if (isPaid) return <>{children}</>;

    if (fallback) return <>{fallback}</>;

    return (
        <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-6 text-center">
            <div className="text-4xl mb-2">🔒</div>
            <h3 className="font-bold text-purple-800 text-base">
                {isTamil ? feature.nameTamil : feature.name}
            </h3>
            <p className="mt-1 text-sm text-purple-600">{feature.description}</p>
            <p className="mt-3 text-xs text-gray-500 font-medium">
                {isTamil ? 'இந்த அம்சத்தை திறக்க மேம்படுத்தவும்' : 'Upgrade to unlock this feature'}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                <span>✨</span>
                {isTamil ? 'பிரீமியம் திட்டம்' : 'Premium Plan'}
            </div>
        </div>
    );
}
