import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { createSession } from '@lib/session-manager.ts';
import { hashPassword } from '@lib/password.ts';

export const create = defineAction({
    accept: 'form',
    input: z.object({
        email: z.string().trim().min(1, "Email is required").includes('@', { message: "Please enter a valid email address" }).includes('.', { message: "Please enter a valid email address" }),
        password: z.string().min(6, "Password must be at least 6 characters long"),
        username: z.string().trim().min(4, "Username must be at least 4 characters long")
    }),
    handler: async ({ email, password, username }, context) => {
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return { ok: false, error: "User with this email already exists" };
            }

            // Hash the password securely
            const passwordHash = await hashPassword(password);

            // Create user with hashed password
            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    username,
                    role: 'Admin' // First user in family becomes admin
                }
            });

            // Create session (default 24 hours)
            const sessionId = createSession(user.id, user.username, user.email);

            const isSecureEnvironment = context.request.url.startsWith('https://');

            context.cookies.set('astro-auth', sessionId, {
                httpOnly: true,
                sameSite: isSecureEnvironment ? 'strict' : 'lax',
                secure: isSecureEnvironment,
                maxAge: 86400, // 24 hours
                path: '/'
            });

            return { ok: true };

        } catch (error) {
            console.error('Create account error:', error);
            return { ok: false, error: "An error occurred during account creation" };
        }
    }
});