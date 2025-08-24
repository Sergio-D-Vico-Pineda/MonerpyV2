import { defineMiddleware } from 'astro:middleware';
import { validateCSRFToken, extractCSRFToken } from '@lib/csrf.ts';
import { getSession } from '@lib/session-manager.ts';

// Actions that require CSRF protection (POST operations that modify data)
const CSRF_PROTECTED_ACTIONS = [
    // User actions
    'create',                      // User registration
    'login',                       // User login
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

    // Extract action name from URL
    const actionName = url.pathname.split('/').pop();
    
    // Only apply CSRF protection to specified actions
    if (!actionName || !CSRF_PROTECTED_ACTIONS.includes(actionName)) {
        return next();
    }

    // Skip CSRF for GET requests (they shouldn't modify data anyway)
    if (request.method !== 'POST') {
        return next();
    }

    // Get session
    const sessionId = cookies.get('astro-auth')?.value;
    if (!sessionId) {
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
        return new Response(JSON.stringify({ 
            ok: false, 
            error: 'Invalid session' 
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

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
    
    if (!validateCSRFToken(csrfToken, session.csrfToken)) {
        console.log(`CSRF validation failed for action: ${actionName}`);
        return new Response(JSON.stringify({ 
            ok: false, 
            error: 'Security validation failed. Please refresh the page and try again.' 
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // CSRF validation passed, continue with request
    return next();
});
