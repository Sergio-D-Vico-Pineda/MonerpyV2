import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';

export const getTags = defineAction({
    accept: 'json',
    input: z.object({
        includeDeleted: z.boolean().optional().default(false)
    }).optional(),
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

            const whereClause = {
                familyId: userWithFamily.familyId,
                ...(input?.includeDeleted ? {} : { deletedAt: null })
            };

            const tags = await prisma.tag.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    color: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    _count: {
                        select: {
                            transactions: {
                                where: { deletedAt: null }
                            },
                            recurringTransactions: {
                                where: { deletedAt: null }
                            }
                        }
                    }
                },
                orderBy: [
                    { name: 'asc' }
                ]
            });

            return { ok: true, tags };

        } catch (error) {
            console.error('Error fetching tags:', error);
            return { ok: false, error: "Failed to fetch tags" };
        }
    }
});

export const getTag = defineAction({
    accept: 'json',
    input: z.object({
        id: z.number()
    }),
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

            const tag = await prisma.tag.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                },
                include: {
                    transactions: {
                        where: { deletedAt: null },
                        select: { id: true }
                    }
                }
            });

            if (!tag) {
                return { ok: false, error: "Tag not found" };
            }

            return {
                ok: true,
                tag: {
                    ...tag,
                    transactionCount: tag.transactions.length
                }
            };

        } catch (error) {
            console.error('Error fetching tag:', error);
            return { ok: false, error: "Failed to fetch tag" };
        }
    }
});

export const getTagsList = defineAction({
    accept: 'json',
    input: z.object({
        includeDeleted: z.boolean().optional().default(false)
    }).optional(),
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

            const whereClause = {
                familyId: userWithFamily.familyId,
                ...(input?.includeDeleted ? {} : { deletedAt: null })
            };

            const tags = await prisma.tag.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    color: true,
                    createdAt: true,
                    deletedAt: true,
                    _count: {
                        select: {
                            transactions: {
                                where: { deletedAt: null }
                            }
                        }
                    }
                },
                orderBy: [
                    { name: 'asc' }
                ]
            });

            return { ok: true, tags };

        } catch (error) {
            console.error('Error fetching tags list:', error);
            return { ok: false, error: "Failed to fetch tags" };
        }
    }
});
