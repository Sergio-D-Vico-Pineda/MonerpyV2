import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';

export const getAccounts = defineAction({
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
                return { ok: false, error: "User must belong to a family" };
            }

            const accounts = await prisma.account.findMany({
                where: {
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                },
                select: {
                    id: true,
                    name: true,
                    accountType: true,
                    balance: true,
                    color: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            return { ok: true, accounts };

        } catch (error) {
            console.error("Error fetching accounts:", error);
            return { ok: false, error: "Failed to fetch accounts" };
        }
    }
});

export const getCategories = defineAction({
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
                return { ok: false, error: "User must belong to a family" };
            }

            const categories = await prisma.category.findMany({
                where: {
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                },
                select: {
                    id: true,
                    name: true,
                    color: true,
                    parentId: true,
                    parent: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: [
                    { parentId: 'asc' },
                    { name: 'asc' }
                ]
            });

            return { ok: true, categories };

        } catch (error) {
            console.error("Error fetching categories:", error);
            return { ok: false, error: "Failed to fetch categories" };
        }
    }
});

export const getTags = defineAction({
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
                return { ok: false, error: "User must belong to a family" };
            }

            const tags = await prisma.tag.findMany({
                where: {
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                },
                select: {
                    id: true,
                    name: true,
                    color: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            return { ok: true, tags };

        } catch (error) {
            console.error("Error fetching tags:", error);
            return { ok: false, error: "Failed to fetch tags" };
        }
    }
});
