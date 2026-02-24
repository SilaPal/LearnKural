/**
 * Central feature registry for LearnKural.
 *
 * USAGE (for new features):
 *  1. Add an entry to FEATURES below with tier: 'all' or tier: 'paid'.
 *  2. Wrap the JSX in <FeatureGate featureId="MY_FEATURE_KEY">...</FeatureGate>
 *
 * TIERS:
 *  'all'  → visible to everyone (free + paid)
 *  'paid' → visible only to users with tier === 'paid'; free users see a paywall card
 */

export type FeatureTier = 'all' | 'paid';

export interface Feature {
    id: string;
    name: string;
    nameTamil: string;
    description: string;
    tier: FeatureTier;
}

export const FEATURES: Record<string, Feature> = {
    // ── Free features (all existing content) ──────────────────────────────────
    KURAL_LEARNING: {
        id: 'KURAL_LEARNING',
        name: 'Kural Learning',
        nameTamil: 'குறள் கற்க',
        description: 'Browse and learn all 1330 kurals with audio',
        tier: 'all',
    },
    KURAL_PLAYING: {
        id: 'KURAL_PLAYING',
        name: 'Kural Games',
        nameTamil: 'குறள் விளையாட்டு',
        description: 'Word puzzle, flying, balloon, and race games',
        tier: 'all',
    },
    KURAL_PROGRESS: {
        id: 'KURAL_PROGRESS',
        name: 'Progress Tracker',
        nameTamil: 'முன்னேற்றம்',
        description: 'Track visited and mastered kurals',
        tier: 'all',
    },
    KURAL_FAVORITES: {
        id: 'KURAL_FAVORITES',
        name: 'Kural Favorites',
        nameTamil: 'பிடித்த குறள்கள்',
        description: 'Bookmark and revisit favourite kurals',
        tier: 'all',
    },
    LEARN_TAMIL: {
        id: 'LEARN_TAMIL',
        name: 'Learn Tamil Letters',
        nameTamil: 'தமிழ் எழுத்து கற்க',
        description: 'Tamil alphabet and letter learning',
        tier: 'all',
    },
    BADGE_SYSTEM: {
        id: 'BADGE_SYSTEM',
        name: 'Achievement Badges',
        nameTamil: 'சாதனை பேட்ஜ்கள்',
        description: 'Streak tracking and achievement badges',
        tier: 'all',
    },

    // ── Paid features (add future premium content below) ──────────────────────
    // Example — uncomment when ready:
    // OFFLINE_MODE: {
    //   id: 'OFFLINE_MODE',
    //   name: 'Offline Mode',
    //   nameTamil: 'இணையமின்றி கற்க',
    //   description: 'Download kurals for offline use',
    //   tier: 'paid',
    // },
    // AI_TUTOR: {
    //   id: 'AI_TUTOR',
    //   name: 'AI Tamil Tutor',
    //   nameTamil: 'AI தமிழ் ஆசிரியர்',
    //   description: 'Personalised AI-powered kural explanations',
    //   tier: 'paid',
    // },
};
