import { defineAction } from "astro:actions";
import { z } from "astro:content";
import { destroySession } from '@lib/session-manager.ts';

const logout = defineAction({
    accept: 'form',
    input: z.object({
        _csrf_token: z.string().optional(), // CSRF token will be handled by middleware
    }).optional(),
    handler: async (input, context) => {
        try {
            // Get session ID from cookie
            const sessionId = context.cookies.get('astro-auth')?.value;

            if (sessionId) {
                // Destroy session from memory and file
                destroySession(sessionId);
            }

            // Clear the cookie
            context.cookies.delete('astro-auth', {
                path: '/'
            });

            return { ok: true };

        } catch (error) {
            console.error('Logout error:', error);
            return { ok: false, error: "An error occurred during logout" };
        }
    }
});

export { logout };