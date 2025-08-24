import { defineMiddleware } from 'astro:middleware';
import { validateCSRFToken, extractCSRFToken } from '@lib/csrf.ts';
import { getSession } from '@lib/session-manager.ts';

// Actions that require CSRF protection (POST operations that modify data)
const CSRF_PROTECTED_ACTIONS = [
    // User actions
    // Note: 'create' (user registration) and 'login' are excluded - they don't need CSRF protection as there's no session yet
    'logout',                      // User logout
    'changePassword',              // Password change
    // Transaction actions
    'createTransaction',
    'updateTransaction',
    'deleteTransaction',
    // Account actions
    'createAccount',
    'updateAccount',
    'deleteAccount',
    'restoreAccount',
    'updateDailyBalance',
    'recalculateAccountBalance',
    // Category actions
    'createCategory',
    'updateCategory',
    'deleteCategory',
    'restoreCategory',
    // Tag actions
    'createTag',
    'updateTag',
    'deleteTag',
    'restoreTag',
    // Recurring transaction actions
    'createRecurringTransaction',
    'updateRecurringTransaction',
    'deleteRecurringTransaction',
    'generateRecurringTransactions',
    // Family actions
    'createFamily',
    'joinFamily',
    'leaveFamily',
    'updateUserRole',
    'removeUserFromFamily'
];

export const csrfMiddleware = defineMiddleware(async (context, next) => {
    const { url, request, cookies } = context;

    // Only check CSRF for action endpoints
    if (!url.pathname.startsWith('/_actions/')) {
        return next();
    }

    // Extract action name from URL (handle trailing slash)
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    const actionName = pathParts[pathParts.length - 1];
    console.log(`[CSRF] Processing action: ${actionName} at ${url.pathname}`);

    // Only apply CSRF protection to specified actions
    if (!actionName || !CSRF_PROTECTED_ACTIONS.includes(actionName)) {
        console.log(`[CSRF] Action ${actionName} not in protected list, skipping CSRF validation`);
        return next();
    }

    console.log(`[CSRF] Action ${actionName} requires CSRF protection`);

    // Skip CSRF for GET requests (they shouldn't modify data anyway)
    if (request.method !== 'POST') {
        console.log(`[CSRF] Skipping CSRF for ${request.method} request`);
        return next();
    }

    console.log(`[CSRF] Validating CSRF for POST request to ${actionName}`);

    // Get session
    const sessionId = cookies.get('astro-auth')?.value;
    if (!sessionId) {
        console.log(`[CSRF] No session ID found`);
        return new Response(JSON.stringify({
            ok: false,
            error: 'Authentication required'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const session = getSession(sessionId);
    if (!session) {
        console.log(`[CSRF] Invalid session for ID: ${sessionId}`);
        return new Response(JSON.stringify({
            ok: false,
            error: 'Invalid session'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log(`[CSRF] Session found, extracting CSRF token`);

    // Extract and validate CSRF token
    let formData: FormData | undefined;

    try {
        // Clone request to read form data without consuming it
        const clonedRequest = request.clone();
        if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') ||
            request.headers.get('content-type')?.includes('multipart/form-data')) {
            formData = await clonedRequest.formData();
        }
    } catch (error) {
        console.warn('Failed to parse form data for CSRF validation:', error);
    }

    const csrfToken = extractCSRFToken(request, formData);
    console.log(`[CSRF] Extracted CSRF token: ${csrfToken ? 'present' : 'missing'}`);
    console.log(`[CSRF] Expected CSRF token: ${session.csrfToken ? 'present' : 'missing'}`);

    if (!validateCSRFToken(csrfToken, session.csrfToken)) {
        console.log(`[CSRF] validation failed for action: ${actionName}`);
        return new Response(JSON.stringify({
            ok: false,
            error: 'Security validation failed. Please refresh the page and try again.'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log(`[CSRF] CSRF validation passed for action: ${actionName}`);
    // CSRF validation passed, continue with request
    return next();
});
