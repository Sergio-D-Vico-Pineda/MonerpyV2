import { createHash } from 'crypto';

/**
 * Generate a browser fingerprint hash from request headers
 */
export function generateFingerprint(request: Request): string {
    const headers = request.headers;
    
    // Get client IP from various possible headers
    const getClientIP = (): string => {
        return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headers.get('x-real-ip') ||
               headers.get('x-client-ip') ||
               headers.get('cf-connecting-ip') ||
               'unknown';
    };

    const fingerprint = {
        userAgent: headers.get('user-agent') || '',
        acceptLanguage: headers.get('accept-language') || '',
        acceptEncoding: headers.get('accept-encoding') || '',
        ip: getClientIP()
    };

    // Create a hash of the fingerprint data
    const fingerprintString = JSON.stringify(fingerprint);
    return createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Validate that current request matches session fingerprint
 */
export function validateFingerprint(request: Request, sessionFingerprint: string): boolean {
    const currentFingerprint = generateFingerprint(request);
    return currentFingerprint === sessionFingerprint;
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
    const headers = request.headers;
    return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           headers.get('x-real-ip') ||
           headers.get('x-client-ip') ||
           headers.get('cf-connecting-ip') ||
           'unknown';
}
