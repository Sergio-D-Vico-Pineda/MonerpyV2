
import { defineMiddleware } from 'astro:middleware';
import { validateSession } from '@lib/session-manager.ts';

export const onRequest = defineMiddleware(async (context, next) => {
    const { request, url, cookies, locals, redirect } = context;

    // Ignore Chrome DevTools requests and return 404
    if (url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
        return new Response('Not Found', { status: 404 });
    } else {
        console.log(`[MIDDLEWARE] Processing request: ${url.pathname}`);
    }


    // Log action requests for debugging
    if (url.pathname.startsWith('/_actions/')) {
        console.log(`[MIDDLEWARE] Action request: ${url.pathname}`);
    }

    // Get session ID from cookie
    const sessionId = cookies.get('astro-auth')?.value;

    // Try to validate session if cookie exists
    if (sessionId) {
        // Check if it's a long-term session by checking cookie max-age
        // We'll assume it's long-term if the session is older than 24 hours but still valid
        const session = validateSession(sessionId, false); // First try short-term
        const longSession = session ? session : validateSession(sessionId, true); // Then try long-term

        if (longSession) {
            // Set user in locals for use in pages
            locals.user = {
                id: longSession.userId,
                username: longSession.username,
                email: longSession.email,
                created: longSession.created
            };
        }
    }

    // Define public paths that don't require authentication
    const publicPaths = ['/', '/login', '/newaccount'];
    const isPublicPath = publicPaths.includes(url.pathname);
    const isActionEndpoint = url.pathname.startsWith('/_actions/');

    // Check if user is on login page with redirectTo parameter and is already logged in
    // If user is logged in and trying to access login page, redirect to dashboard
    // But skip this for action endpoints to avoid interfering with login/logout actions
    if (locals.user && url.pathname === '/login' && !isActionEndpoint) {
        const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
        console.log(`[MIDDLEWARE] Redirecting authenticated user from login to ${redirectTo}`);
        return redirect(redirectTo, 302);
    }

    // If user is not logged in and trying to access a protected page, redirect to login
    // But only if the route actually exists - let non-existent routes fall through to 404
    if (!locals.user && !isPublicPath && !isActionEndpoint) {
        // First, let Astro process the request to see if the route exists
        const response = await next();

        // If the response is 404, the route doesn't exist, so return the 404
        if (response.status === 404) {
            console.log(`[MIDDLEWARE] Route ${url.pathname} does not exist, returning 404`);
            return response;
        }

        // If we get here, the route exists but user is not authenticated
        console.log(`[MIDDLEWARE] Redirecting unauthenticated user from ${url.pathname} to login`);
        const loginUrl = new URL('/login', url.origin);
        loginUrl.searchParams.set('redirectTo', url.pathname + url.search);
        return redirect(loginUrl.toString(), 302);
    }

    // For all other cases, process the request normally
    const response = await next();
    return response;
});