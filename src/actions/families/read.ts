import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';

export const getFamilies = defineAction({
    accept: 'json',
    input: z.object({}).optional(),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) {
                return { ok: false, error: "Authentication required" };
            }

            const families = await prisma.family.findMany({
                where: {
                    deletedAt: null
                },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    _count: {
                        select: {
                            users: {
                                where: { deletedAt: null }
                            }
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                }
            });

            return { ok: true, families };

        } catch (error) {
            console.error("Error fetching families:", error);
            return { ok: false, error: "Failed to fetch families" };
        }
    }
});

export const getFamilyDetails = defineAction({
    accept: 'json',
    input: z.object({}).optional(),
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
                return { ok: false, error: "User doesn't belong to any family" };
            }

            const family = await prisma.family.findFirst({
                where: {
                    id: userWithFamily.familyId,
                    deletedAt: null
                },
                include: {
                    users: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                            createdAt: true
                        },
                        orderBy: [
                            { role: 'asc' },
                            { username: 'asc' }
                        ]
                    },
                    accounts: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            name: true,
                            accountType: true,
                            balance: true,
                            color: true
                        },
                        orderBy: { name: 'asc' }
                    },
                    _count: {
                        select: {
                            accounts: {
                                where: { deletedAt: null }
                            },
                            categories: {
                                where: { deletedAt: null }
                            },
                            tags: {
                                where: { deletedAt: null }
                            }
                        }
                    }
                }
            });

            if (!family) {
                return { ok: false, error: "Family not found" };
            }

            return { ok: true, family, userRole: userWithFamily.role };

        } catch (error) {
            console.error("Error fetching family details:", error);
            return { ok: false, error: "Failed to fetch family details" };
        }
    }
});

export const updateUserRole = defineAction({
    accept: 'form',
    input: z.object({
        userId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), "User ID is required"),
        role: z.enum(['Admin', 'Member'])
    }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) {
                return { ok: false, error: "Authentication required" };
            }

            // Get current user with family info
            const currentUserWithFamily = await prisma.user.findUnique({
                where: { id: user.id },
                include: { family: true }
            });

            if (!currentUserWithFamily?.familyId) {
                return { ok: false, error: "You don't belong to any family" };
            }

            if (currentUserWithFamily.role !== 'Admin') {
                return { ok: false, error: "Only admins can change user roles" };
            }

            // Get target user
            const targetUser = await prisma.user.findFirst({
                where: {
                    id: input.userId,
                    familyId: currentUserWithFamily.familyId,
                    deletedAt: null
                }
            });

            if (!targetUser) {
                return { ok: false, error: "User not found in your family" };
            }

            // Prevent demoting yourself if you're the only admin
            if (targetUser.id === user.id && input.role === 'Member') {
                const adminCount = await prisma.user.count({
                    where: {
                        familyId: currentUserWithFamily.familyId,
                        role: 'Admin',
                        deletedAt: null
                    }
                });

                if (adminCount <= 1) {
                    return { ok: false, error: "Cannot demote yourself: You are the only admin" };
                }
            }

            // Update user role
            await prisma.user.update({
                where: { id: input.userId },
                data: { role: input.role }
            });

            return { ok: true };

        } catch (error) {
            console.error("Error updating user role:", error);
            return { ok: false, error: "Failed to update user role" };
        }
    }
});

export const removeUserFromFamily = defineAction({
    accept: 'form',
    input: z.object({
        userId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), "User ID is required")
    }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) {
                return { ok: false, error: "Authentication required" };
            }

            // Get current user with family info
            const currentUserWithFamily = await prisma.user.findUnique({
                where: { id: user.id },
                include: { family: true }
            });

            if (!currentUserWithFamily?.familyId) {
                return { ok: false, error: "You don't belong to any family" };
            }

            if (currentUserWithFamily.role !== 'Admin') {
                return { ok: false, error: "Only admins can remove users from family" };
            }

            // Get target user
            const targetUser = await prisma.user.findFirst({
                where: {
                    id: input.userId,
                    familyId: currentUserWithFamily.familyId,
                    deletedAt: null
                }
            });

            if (!targetUser) {
                return { ok: false, error: "User not found in your family" };
            }

            // Prevent removing yourself if you're the only admin
            if (targetUser.id === user.id) {
                const adminCount = await prisma.user.count({
                    where: {
                        familyId: currentUserWithFamily.familyId,
                        role: 'Admin',
                        deletedAt: null
                    }
                });

                const memberCount = await prisma.user.count({
                    where: {
                        familyId: currentUserWithFamily.familyId,
                        deletedAt: null
                    }
                });

                if (adminCount <= 1 && memberCount > 1) {
                    return { ok: false, error: "Cannot remove yourself: You are the only admin" };
                }
            }

            // Remove user from family
            await prisma.user.update({
                where: { id: input.userId },
                data: {
                    familyId: null,
                    role: 'Member'
                }
            });

            return { ok: true };

        } catch (error) {
            console.error("Error removing user from family:", error);
            return { ok: false, error: "Failed to remove user from family" };
        }
    }
});
