import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import type { Session } from '@types.d.ts';
import { generateCSRFToken } from './csrf.ts';
import { generateFingerprint } from './fingerprint.ts';

// In-memory session storage
const sessions = new Map<string, Session>();

// Path to sessions file
const SESSIONS_FILE = join(process.cwd(), 'sessions.json');

/**
 * Generate a 32-byte random hex string for session ID
 */
export function generateSessionId(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Check if a session is expired based on duration
 */
function isSessionExpired(session: Session, duration: number): boolean {
    const now = Date.now();
    const created = parseInt(session.created);
    return (now - created) > duration;
}

/**
 * Clean up expired sessions from memory and return cleaned sessions
 */
function cleanupExpiredSessions(): Record<string, Session> {
    const validSessions: Record<string, Session> = {};
    const now = Date.now();

    for (const [sessionId, session] of sessions) {
        const created = parseInt(session.created);
        // Check both 24h and 30d durations to keep any valid session
        const shortDuration = 24 * 60 * 60 * 1000; // 24 hours
        const longDuration = 30 * 24 * 60 * 60 * 1000; // 30 days

        if ((now - created) <= longDuration) {
            validSessions[sessionId] = session;
        } else {
            sessions.delete(sessionId);
        }
    }

    return validSessions;
}

/**
 * Load sessions from file on server start
 */
export function loadSessionsFromFile(): void {
    try {
        if (existsSync(SESSIONS_FILE)) {
            const data = readFileSync(SESSIONS_FILE, 'utf-8');

            // Check if file is empty or contains only whitespace
            if (!data || data.trim() === '') {
                console.log('Sessions file is empty, starting with clean session storage');
                return;
            }

            let storedSessions: Record<string, Session>;
            try {
                storedSessions = JSON.parse(data);
            } catch (parseError) {
                console.warn('Failed to parse sessions file, starting with clean session storage:', parseError);
                return;
            }

            // Check if parsed data is valid
            if (!storedSessions || typeof storedSessions !== 'object') {
                console.warn('Invalid sessions data format, starting with clean session storage');
                return;
            }

            // Only load non-expired sessions
            const now = Date.now();
            const longDuration = 30 * 24 * 60 * 60 * 1000; // 30 days max

            for (const [sessionId, session] of Object.entries(storedSessions)) {
                // Validate session structure
                if (!session || typeof session !== 'object' || !session.userId || !session.email || !session.created) {
                    console.warn(`Skipping invalid session: ${sessionId}`);
                    continue;
                }

                const created = parseInt(session.created);
                if (isNaN(created)) {
                    console.warn(`Skipping session with invalid created timestamp: ${sessionId}`);
                    continue;
                }

                if ((now - created) <= longDuration) {
                    sessions.set(sessionId, session);
                }
            }

            console.log(`Loaded ${sessions.size} valid sessions from file`);
        } else {
            console.log('Sessions file does not exist, starting with clean session storage');
        }
    } catch (error) {
        console.warn('Failed to load sessions from file:', error);
        console.log('Starting with clean session storage');
    }
}

/**
 * Save sessions to file
 */
export function saveSessionsToFile(): void {
    try {
        const cleanedSessions = cleanupExpiredSessions();
        writeFileSync(SESSIONS_FILE, JSON.stringify(cleanedSessions, null, 2));
    } catch (error) {
        console.warn('Failed to save sessions to file:', error);
    }
}

/**
 * Create a new session
 */
export function createSession(userId: number, username: string, email: string, request: Request): string {
    const sessionId = generateSessionId();
    const session: Session = {
        userId,
        username,
        email,
        created: Date.now().toString(),
        fingerprint: generateFingerprint(request),
        csrfToken: generateCSRFToken()
    };

    sessions.set(sessionId, session);
    saveSessionsToFile(); // Persist immediately

    return sessionId;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): Session | null {
    return sessions.get(sessionId) || null;
}

/**
 * Validate session and check expiration
 */
export function validateSession(sessionId: string, isLongTerm: boolean = false): Session | null {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const duration = isLongTerm ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    if (isSessionExpired(session, duration)) {
        sessions.delete(sessionId);
        saveSessionsToFile(); // Clean up immediately
        return null;
    }

    return session;
}

/**
 * Destroy a session
 */
export function destroySession(sessionId: string): void {
    sessions.delete(sessionId);
    saveSessionsToFile(); // Persist immediately
}

/**
 * Destroy all sessions for a specific user except the current one
 */
export function destroyOtherUserSessions(userId: number, currentSessionId: string): number {
    let destroyedCount = 0;
    
    for (const [sessionId, session] of sessions) {
        if (session.userId === userId && sessionId !== currentSessionId) {
            sessions.delete(sessionId);
            destroyedCount++;
        }
    }
    
    if (destroyedCount > 0) {
        saveSessionsToFile(); // Persist immediately
    }
    
    return destroyedCount;
}

/**
 * Destroy all sessions for a specific user
 */
export function destroyAllUserSessions(userId: number): number {
    let destroyedCount = 0;
    
    for (const [sessionId, session] of sessions) {
        if (session.userId === userId) {
            sessions.delete(sessionId);
            destroyedCount++;
        }
    }
    
    if (destroyedCount > 0) {
        saveSessionsToFile(); // Persist immediately
    }
    
    return destroyedCount;
}

// Load sessions when module is imported
loadSessionsFromFile();
