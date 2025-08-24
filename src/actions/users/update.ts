import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';
import { getSession, updateSessionUserData } from '@lib/session-manager.ts';
import { validateCSRFToken, extractCSRFToken } from '@lib/csrf.ts';

const updateProfile = defineAction({
    accept: 'form',
    input: z.object({
        username: z.string().min(1, "Username is required").max(50, "Username must be 50 characters or less"),
        email: z.string().trim().min(1, "Email is required").includes('@', { message: "Please enter a valid email address" }).includes('.', { message: "Please enter a valid email address" }),
        _csrf_token: z.string().optional()
    }),
    handler: async ({ username, email, _csrf_token }, context) => {
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
                console.log('CSRF token validation failed for profile update');
                return { ok: false, error: "Security validation failed" };
            }

            // Get current user from database
            const currentUser = await prisma.user.findUnique({
                where: { id: session.userId }
            });

            if (!currentUser) {
                return { ok: false, error: "User not found" };
            }

            // Check if email is already taken by another user
            if (email !== currentUser.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email }
                });

                if (existingUser && existingUser.id !== session.userId) {
                    return { ok: false, error: "Email is already in use by another account" };
                }
            }

            // Update user profile in database
            const updatedUser = await prisma.user.update({
                where: { id: session.userId },
                data: {
                    username: username.trim(),
                    email: email.trim().toLowerCase(),
                    updatedAt: getCurrentDateTime()
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    updatedAt: true
                }
            });

            // Update session data to keep it in sync
            updateSessionUserData(sessionId, updatedUser.username, updatedUser.email);

            return {
                ok: true,
                message: "Profile updated successfully",
                user: updatedUser
            };

        } catch (error) {
            console.error('Update profile error:', error);

            // Handle specific Prisma errors
            if (error instanceof Error) {
                if (error.message.includes('Unique constraint failed on the fields: (`email`)')) {
                    return { ok: false, error: "Email is already in use by another account" };
                }
            }

            return { ok: false, error: "An error occurred while updating profile" };
        }
    }
});

export { updateProfile };
