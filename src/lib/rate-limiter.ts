import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface LoginAttempt {
    count: number;
    lastAttempt: number;
    blockedUntil?: number;
}

interface RateLimitData {
    ipAttempts: Record<string, LoginAttempt>;
    emailAttempts: Record<string, LoginAttempt>;
}

// In-memory storage
let rateLimitData: RateLimitData = {
    ipAttempts: {},
    emailAttempts: {}
};

// Configuration
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const RATE_LIMIT_FILE = join(process.cwd(), 'rate-limits.json');

/**
 * Load rate limit data from file on server start
 */
export function loadRateLimitData(): void {
    try {
        if (existsSync(RATE_LIMIT_FILE)) {
            const data = readFileSync(RATE_LIMIT_FILE, 'utf-8');

            if (!data || data.trim() === '') {
                console.log('Rate limit file is empty, starting with clean data');
                return;
            }

            let storedData: RateLimitData;
            try {
                storedData = JSON.parse(data);
            } catch (parseError) {
                console.warn('Failed to parse rate limit file, starting with clean data:', parseError);
                return;
            }

            if (!storedData || typeof storedData !== 'object') {
                console.warn('Invalid rate limit data format, starting with clean data');
                return;
            }

            // Clean up expired blocks
            const now = Date.now();
            const cleanData: RateLimitData = {
                ipAttempts: {},
                emailAttempts: {}
            };

            // Clean IP attempts
            for (const [ip, attempt] of Object.entries(storedData.ipAttempts || {})) {
                if (attempt.blockedUntil && now < attempt.blockedUntil) {
                    cleanData.ipAttempts[ip] = attempt;
                } else if (!attempt.blockedUntil && (now - attempt.lastAttempt) < (60 * 60 * 1000)) {
                    // Keep attempts from last hour
                    cleanData.ipAttempts[ip] = attempt;
                }
            }

            // Clean email attempts
            for (const [email, attempt] of Object.entries(storedData.emailAttempts || {})) {
                if (attempt.blockedUntil && now < attempt.blockedUntil) {
                    cleanData.emailAttempts[email] = attempt;
                } else if (!attempt.blockedUntil && (now - attempt.lastAttempt) < (60 * 60 * 1000)) {
                    // Keep attempts from last hour
                    cleanData.emailAttempts[email] = attempt;
                }
            }

            rateLimitData = cleanData;
            console.log('Loaded rate limit data from file');
        } else {
            console.log('Rate limit file does not exist, starting with clean data');
        }
    } catch (error) {
        console.warn('Failed to load rate limit data from file:', error);
        console.log('Starting with clean rate limit data');
    }
}

/**
 * Save rate limit data to file
 */
export function saveRateLimitData(): void {
    try {
        writeFileSync(RATE_LIMIT_FILE, JSON.stringify(rateLimitData, null, 2));
    } catch (error) {
        console.warn('Failed to save rate limit data to file:', error);
    }
}

/**
 * Check if IP or email is currently blocked
 */
export function isBlocked(ip: string, email: string): { blocked: boolean; reason?: string; unblockTime?: number } {
    const now = Date.now();

    // Check IP block
    const ipAttempt = rateLimitData.ipAttempts[ip];
    if (ipAttempt?.blockedUntil && now < ipAttempt.blockedUntil) {
        return {
            blocked: true,
            reason: 'IP address blocked due to too many failed login attempts',
            unblockTime: ipAttempt.blockedUntil
        };
    }

    // Check email block
    const emailAttempt = rateLimitData.emailAttempts[email];
    if (emailAttempt?.blockedUntil && now < emailAttempt.blockedUntil) {
        return {
            blocked: true,
            reason: 'Email address blocked due to too many failed login attempts',
            unblockTime: emailAttempt.blockedUntil
        };
    }

    return { blocked: false };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(ip: string, email: string): void {
    const now = Date.now();

    // Record IP attempt
    if (!rateLimitData.ipAttempts[ip]) {
        rateLimitData.ipAttempts[ip] = { count: 0, lastAttempt: now };
    }

    const ipAttempt = rateLimitData.ipAttempts[ip];

    // Reset count if last attempt was more than 1 hour ago
    if (now - ipAttempt.lastAttempt > (60 * 60 * 1000)) {
        ipAttempt.count = 0;
    }

    ipAttempt.count++;
    ipAttempt.lastAttempt = now;

    if (ipAttempt.count >= MAX_ATTEMPTS) {
        ipAttempt.blockedUntil = now + BLOCK_DURATION;
    }

    // Record email attempt
    if (!rateLimitData.emailAttempts[email]) {
        rateLimitData.emailAttempts[email] = { count: 0, lastAttempt: now };
    }

    const emailAttempt = rateLimitData.emailAttempts[email];

    // Reset count if last attempt was more than 1 hour ago
    if (now - emailAttempt.lastAttempt > (60 * 60 * 1000)) {
        emailAttempt.count = 0;
    }

    emailAttempt.count++;
    emailAttempt.lastAttempt = now;

    if (emailAttempt.count >= MAX_ATTEMPTS) {
        emailAttempt.blockedUntil = now + BLOCK_DURATION;
    }

    saveRateLimitData();
}

/**
 * Clear failed attempts for successful login (optional - you might want to keep some history)
 */
export function clearFailedAttempts(ip: string, email: string): void {
    delete rateLimitData.ipAttempts[ip];
    delete rateLimitData.emailAttempts[email];
    saveRateLimitData();
}

/**
 * Get remaining attempts before block
 */
export function getRemainingAttempts(ip: string, email: string): { ip: number; email: number } {
    const now = Date.now();

    let ipRemaining = MAX_ATTEMPTS;
    let emailRemaining = MAX_ATTEMPTS;

    const ipAttempt = rateLimitData.ipAttempts[ip];
    if (ipAttempt && !ipAttempt.blockedUntil) {
        // Reset if last attempt was more than 1 hour ago
        if (now - ipAttempt.lastAttempt <= (60 * 60 * 1000)) {
            ipRemaining = Math.max(0, MAX_ATTEMPTS - ipAttempt.count);
        }
    }

    const emailAttempt = rateLimitData.emailAttempts[email];
    if (emailAttempt && !emailAttempt.blockedUntil) {
        // Reset if last attempt was more than 1 hour ago
        if (now - emailAttempt.lastAttempt <= (60 * 60 * 1000)) {
            emailRemaining = Math.max(0, MAX_ATTEMPTS - emailAttempt.count);
        }
    }

    return { ip: ipRemaining, email: emailRemaining };
}

// Load rate limit data when module is imported
loadRateLimitData();
