import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';

export const getCategories = defineAction({
    accept: 'json',
    input: z.object({
        includeDeleted: z.boolean().optional().default(false),
        parentId: z.number().optional().nullable()
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
                ...(input?.includeDeleted ? {} : { deletedAt: null }),
                ...(input?.parentId !== undefined ? { parentId: input.parentId } : {})
            };

            const categories = await prisma.category.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    color: true,
                    parentId: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    _count: {
                        select: {
                            transactions: {
                                where: { deletedAt: null }
                            },
                            children: {
                                where: { deletedAt: null }
                            }
                        }
                    },
                    children: {
                        where: input?.includeDeleted ? {} : { deletedAt: null },
                        select: {
                            id: true,
                            name: true,
                            color: true,
                            parentId: true
                        }
                    },
                    parent: {
                        select: {
                            id: true,
                            name: true,
                            color: true
                        }
                    }
                },
                orderBy: [
                    { name: 'asc' }
                ]
            });

            return { ok: true, categories };

        } catch (error) {
            console.error('Error fetching categories:', error);
            return { ok: false, error: "Failed to fetch categories" };
        }
    }
});

export const getCategory = defineAction({
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

            const category = await prisma.category.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                },
                include: {
                    children: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            name: true,
                            color: true
                        }
                    },
                    parent: {
                        select: {
                            id: true,
                            name: true,
                            color: true
                        }
                    },
                    transactions: {
                        where: { deletedAt: null },
                        select: { id: true }
                    }
                }
            });

            if (!category) {
                return { ok: false, error: "Category not found" };
            }

            return {
                ok: true,
                category: {
                    ...category,
                    transactionCount: category.transactions.length
                }
            };

        } catch (error) {
            console.error('Error fetching category:', error);
            return { ok: false, error: "Failed to fetch category" };
        }
    }
});

export const getCategoriesList = defineAction({
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

            const categories = await prisma.category.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    color: true,
                    parentId: true,
                    createdAt: true,
                    deletedAt: true,
                    _count: {
                        select: {
                            transactions: {
                                where: { deletedAt: null }
                            },
                            children: {
                                where: input?.includeDeleted ? {} : { deletedAt: null }
                            }
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
            console.error('Error fetching categories list:', error);
            return { ok: false, error: "Failed to fetch categories" };
        }
    }
});
