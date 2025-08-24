import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import type { Category, GetCategoriesResult } from "@types.d.ts";

// Helper to build the `select` object for category queries.
function buildCategorySelect(opts?: { includeUpdated?: boolean; includeChildrenRelation?: boolean; includeChildrenRelationIncludeDeleted?: boolean; includeParentRelation?: boolean; childrenCountIncludeDeleted?: boolean }) {
    const {
        includeUpdated = false,
        includeChildrenRelation = false,
        includeChildrenRelationIncludeDeleted = false,
        includeParentRelation = false,
        childrenCountIncludeDeleted = false
    } = opts ?? {};

    const select: any = {
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
                    where: childrenCountIncludeDeleted ? {} : { deletedAt: null }
                }
            }
        }
    };

    if (includeUpdated) select.updatedAt = true;

    if (includeChildrenRelation) {
        select.children = {
            where: includeChildrenRelationIncludeDeleted ? {} : { deletedAt: null },
            select: {
                id: true,
                name: true,
                color: true,
                parentId: true
            }
        };
    }

    if (includeParentRelation) {
        select.parent = {
            select: {
                id: true,
                name: true,
                color: true
            }
        };
    }

    return select;
}

// GetCategoriesResult is imported from the shared types file.

const getCategories = defineAction({
    accept: 'json',
    input: z.object({
        includeDeleted: z.boolean().optional().default(false),
        parentId: z.number().optional().nullable(),
        compact: z.boolean().optional().default(false)
    }).optional(),
    handler: async (input, context): Promise<GetCategoriesResult> => {
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

            const compact = input?.compact ?? false;

            const categories = await prisma.category.findMany({
                where: whereClause,
                select: buildCategorySelect({
                    includeUpdated: !compact,
                    includeChildrenRelation: !compact,
                    includeChildrenRelationIncludeDeleted: !!input?.includeDeleted,
                    includeParentRelation: !compact,
                    childrenCountIncludeDeleted: !!input?.includeDeleted
                }),
                orderBy: [
                    { name: 'asc' }
                ]
            });

            // categories comes from Prisma; it should match Category when
            // the query includes the parent/children/_count fields as built
            // by buildCategorySelect. We trust the server shape here.
            return { ok: true, categories: categories as unknown as Category[] };

        } catch (error) {
            console.error('Error fetching categories:', error);
            return { ok: false, error: "Failed to fetch categories" };
        }
    }
});

const getCategory = defineAction({
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

export {
    getCategories,
    getCategory
};