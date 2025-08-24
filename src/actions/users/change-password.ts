import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { hashPassword, verifyPassword } from '@lib/password.ts';
import { getCurrentDateTime } from '@lib/date-utils.ts';
import { destroyOtherUserSessions, getSession } from '@lib/session-manager.ts';
import { validateCSRFToken, extractCSRFToken } from '@lib/csrf.ts';

const changePassword = defineAction({
    accept: 'form',
    input: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "New password must be at least 6 characters long"),
        _csrf_token: z.string().optional()
    }),
    handler: async ({ currentPassword, newPassword, _csrf_token }, context) => {
        try {
            // Check if user is authenticated
            const sessionId = context.cookies.get('astro-auth')?.value;
            if (!sessionId) {
                return { ok: false, error: "Authentication required" };
            }

            const session = getSession(sessionId);
            if (!session) {
                return { ok: false, error: "Invalid session" };
            }

            // Validate CSRF token
            const formData = new FormData();
            if (_csrf_token) {
                formData.append('_csrf_token', _csrf_token);
            }
            const csrfToken = extractCSRFToken(context.request, formData);
            
            if (!validateCSRFToken(csrfToken, session.csrfToken)) {
                console.log('CSRF token validation failed for password change');
                return { ok: false, error: "Security validation failed" };
            }

            // Get user from database
            const user = await prisma.user.findUnique({
                where: { id: session.userId }
            });

            if (!user) {
                return { ok: false, error: "User not found" };
            }

            // Verify current password
            const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                return { ok: false, error: "Current password is incorrect" };
            }

            // Hash new password
            const newPasswordHash = await hashPassword(newPassword);

            // Update password in database
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: newPasswordHash,
                    updatedAt: getCurrentDateTime()
                }
            });

            // Destroy all other sessions for this user (keep current session active)
            const destroyedSessions = destroyOtherUserSessions(user.id, sessionId);

            console.log(`Password changed for user ${user.id}. Destroyed ${destroyedSessions} other sessions.`);

            return { 
                ok: true, 
                message: "Password changed successfully",
                destroyedSessions 
            };

        } catch (error) {
            console.error('Change password error:', error);
            return { ok: false, error: "An error occurred while changing password" };
        }
    }
});

export { changePassword };
