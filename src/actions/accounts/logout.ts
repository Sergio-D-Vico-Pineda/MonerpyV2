import { defineAction } from "astro:actions";
import { destroySession } from '@lib/session-manager.ts';

export const logout = defineAction({
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