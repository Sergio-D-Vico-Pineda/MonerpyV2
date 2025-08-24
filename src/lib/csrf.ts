import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token from form against session token
 */
export function validateCSRFToken(formToken: string | null, sessionToken: string): boolean {
    if (!formToken || !sessionToken) {
        return false;
    }
    
    // Use constant-time comparison to prevent timing attacks
    if (formToken.length !== sessionToken.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < formToken.length; i++) {
        result |= formToken.charCodeAt(i) ^ sessionToken.charCodeAt(i);
    }
    
    return result === 0;
}

/**
 * Extract CSRF token from various sources (form data, headers)
 */
export function extractCSRFToken(request: Request, formData?: FormData): string | null {
    // Try to get from form data first
    if (formData) {
        const token = formData.get('_csrf_token');
        if (typeof token === 'string') {
            return token;
        }
    }
    
    // Try to get from headers
    return request.headers.get('x-csrf-token') || 
           request.headers.get('x-xsrf-token') || 
           null;
}
