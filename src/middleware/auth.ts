import type { Session } from "../types/types";

function isAuthenticated(request: Request): boolean {
    const session = getSession(request);
    if (!session) return false;

    // Verify the session is not expired
    const createdDate = new Date(session.created);
    const now = new Date();

    // Get the cookie to check if it's a long-term session
    const cookies = request.headers.get('cookie');
    const sessionCookie = cookies?.split(';').find(c => c.trim().startsWith('session='));
    if (!sessionCookie) return false;

    // Check if the cookie has Max-Age for long term session
    const isLongTerm = sessionCookie.includes('Max-Age=2592000'); // 30 days
    const maxAge = isLongTerm ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    return (now.getTime() - createdDate.getTime()) < maxAge;
}

function getSession(request: Request): Session | null {
    const cookies = request.headers.get('cookie');
    if (!cookies) return null;

    const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
    if (!sessionCookie) return null;

    try {
        const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        if (!session.userId || !session.email || !session.created) return null;
        return session as Session;
    } catch {
        return null;
    }
}

function getCurrentUserId(request: Request): number | null {
    const session = getSession(request);
    return session?.userId ?? null;
}

export {
    isAuthenticated,
    getSession,
    getCurrentUserId
}