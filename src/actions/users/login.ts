import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { createSession } from '@lib/session-manager.ts';
import { verifyPassword } from '@lib/password.ts';
import { getCurrentDateTime } from "@/lib/date-utils";
import { isBlocked, recordFailedAttempt, clearFailedAttempts } from '@lib/rate-limiter.ts';
import { getClientIP } from '@lib/fingerprint.ts';

const login = defineAction({
    accept: 'form',
    input: z.object({
        email: z.string().trim().min(1, "Email is required").includes('@', { message: "Please enter a valid email address" }).includes('.', { message: "Please enter a valid email address" }),
        password: z.string().min(1, "Password is required"),
        remember: z.string().nullable().transform(val => val === 'on')
    }),
    handler: async ({ email, password, remember }, context) => {
        try {
            console.log("Attempting login for email:", email);
            
            // Get client IP for rate limiting
            const clientIP = getClientIP(context.request);
            
            // Check if IP or email is currently blocked
            const blockStatus = isBlocked(clientIP, email);
            if (blockStatus.blocked) {
                console.log(`Login blocked: ${blockStatus.reason}`);
                return { 
                    ok: false, 
                    error: blockStatus.reason,
                    blockedUntil: blockStatus.unblockTime
                };
            }
            
            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                recordFailedAttempt(clientIP, email);
                return { ok: false, error: "Invalid email or password" };
            }

            // Verify password using secure hashing
            const isPasswordValid = await verifyPassword(password, user.passwordHash);
            if (!isPasswordValid) {
                recordFailedAttempt(clientIP, email);
                return { ok: false, error: "Invalid email or password" };
            }

            // Clear failed attempts on successful login
            clearFailedAttempts(clientIP, email);

            // Create session with fingerprint and CSRF token
            const sessionId = createSession(user.id, user.username, user.email, context.request);
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: getCurrentDateTime() }
            });

            // Set cookie with appropriate duration
            const maxAge = remember ? 2592000 : 86400; // 30 days or 24 hours in seconds
            const isSecureEnvironment = context.request.url.startsWith('https://');

            // Set the cookie
            context.cookies.set('astro-auth', sessionId, {
                httpOnly: true,
                sameSite: isSecureEnvironment ? 'strict' : 'lax',
                secure: isSecureEnvironment,
                maxAge: maxAge,
                path: '/'
            });

            return { ok: true };

        } catch (error) {
            console.error('Login error:', error);
            return { ok: false, error: "An error occurred during login" };
        }
    }
});

export { login };