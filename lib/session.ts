import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_secret_for_development_only';

/**
 * Creates a computationally secure session string. 
 * Format: base64(payload) + '.' + HMAC-SHA256(base64(payload), secret)
 */
export function signSession(payload: any): string {
    const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(dataStr)
        .digest('base64');
    return `${dataStr}.${signature}`;
}

/**
 * Verifies a session string and returns the parsed payload.
 * Returns null if the signature is invalid or parsing fails.
 */
export function verifySession(token: string): any | null {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [dataStr, signature] = parts;
    const expectedSignature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(dataStr)
        .digest('base64');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        try {
            return JSON.parse(Buffer.from(dataStr, 'base64').toString('utf-8'));
        } catch {
            return null;
        }
    }

    return null;
}
