/**
 * Detects the user's region from their browser timezone.
 * No API calls, no permissions — instant and silent.
 * Returns one of the app's known region strings.
 */
export function detectRegionFromTimezone(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Sri Lanka
        if (tz === 'Asia/Colombo') return 'Sri Lanka';

        // India
        if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'India';

        // Singapore
        if (tz === 'Asia/Singapore') return 'Singapore';

        // Malaysia
        if (tz === 'Asia/Kuala_Lumpur' || tz === 'Asia/Kuching') return 'Malaysia';

        // Australia
        if (tz.startsWith('Australia/') || tz === 'Pacific/Auckland') return 'Australia';

        // UAE & Saudi Arabia
        if (tz === 'Asia/Dubai' || tz === 'Asia/Muscat') return 'United Arab Emirates';
        if (tz === 'Asia/Riyadh') return 'Saudi Arabia';

        // Europe
        if (tz.startsWith('Europe/London')) return 'United Kingdom';
        if (tz.startsWith('Europe/Berlin') || tz.startsWith('Europe/Paris') || tz.startsWith('Europe/Rome') || tz.startsWith('Europe/Madrid')) return 'Europe (Central)';

        // North America
        if (tz.startsWith('US/') || tz.startsWith('America/New_York') || tz.startsWith('America/Chicago') || tz.startsWith('America/Los_Angeles') || tz.startsWith('America/Denver')) return 'United States';
        if (tz.startsWith('Canada/') || tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver')) return 'Canada';

        // Default fallback for uncaught timezones
        const parts = tz.split('/');
        if (parts.length > 1) {
            // Example: "America/Sao_Paulo" -> "Sao Paulo"
            return parts[parts.length - 1].replace(/_/g, ' ');
        }
        return 'Global';
    } catch {
        return 'Global';
    }
}
