import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

export const createFamily = defineAction({
    accept: 'form',
    input: z.object({
        name: z.string().trim().min(1, "Family name is required")
    }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) {
                return { ok: false, error: "Authentication required" };
            }

            // Check if user already belongs to a family
            const userWithFamily = await prisma.user.findUnique({
                where: { id: user.id },
                include: { family: true }
            });

            if (userWithFamily?.familyId) {
                return { ok: false, error: "You already belong to a family" };
            }

            // Create family
            const family = await prisma.family.create({
                data: {
                    name: input.name,
                    createdAt: getCurrentDateTime(),
                    updatedAt: getCurrentDateTime()
                }
            });

            // Update user to belong to this family and make them admin
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    familyId: family.id,
                    role: 'Admin',
                    updatedAt: getCurrentDateTime()
                }
            });

            return { ok: true, family };

        } catch (error) {
            console.error("Error creating family:", error);
            return { ok: false, error: "Failed to create family" };
        }
    }
});

export const joinFamily = defineAction({
    accept: 'form',
    input: z.object({
        familyId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), "Family ID is required")
    }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) {
                return { ok: false, error: "Authentication required" };
            }

            // Check if user already belongs to a family
            const userWithFamily = await prisma.user.findUnique({
                where: { id: user.id },
                include: { family: true }
            });

            if (userWithFamily?.familyId) {
                return { ok: false, error: "You already belong to a family" };
            }

            // Check if family exists
            const family = await prisma.family.findFirst({
                where: {
                    id: input.familyId,
                    deletedAt: null
                }
            });

            if (!family) {
                return { ok: false, error: "Family not found" };
            }

            // Update user to belong to this family as member
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    familyId: family.id,
                    role: 'Member'
                }
            });

            return { ok: true, family };

        } catch (error) {
            console.error("Error joining family:", error);
            return { ok: false, error: "Failed to join family" };
        }
    }
});

export const leaveFamily = defineAction({
    accept: 'form',
    input: z.object({}),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) {
                return { ok: false, error: "Authentication required" };
            }

            // Get user with family info
            const userWithFamily = await prisma.user.findUnique({
                where: { id: user.id },
                include: { family: true }
            });

            if (!userWithFamily?.familyId) {
                return { ok: false, error: "You don't belong to any family" };
            }

            // Check if user is the only admin
            const adminCount = await prisma.user.count({
                where: {
                    familyId: userWithFamily.familyId,
                    role: 'Admin',
                    deletedAt: null
                }
            });

            if (userWithFamily.role === 'Admin' && adminCount <= 1) {
                const memberCount = await prisma.user.count({
                    where: {
                        familyId: userWithFamily.familyId,
                        deletedAt: null
                    }
                });

                if (memberCount <= 1) {
                    return { ok: false, error: "Cannot leave family: You are the only admin. Promote another member to admin first." };
                }
            }

            // Remove user from family
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    familyId: null,
                    role: 'Member'
                }
            });

            return { ok: true };

        } catch (error) {
            console.error("Error leaving family:", error);
            return { ok: false, error: "Failed to leave family" };
        }
    }
});
