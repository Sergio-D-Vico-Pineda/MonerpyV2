import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

export const deleteCategory = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().transform(val => parseInt(val))
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

            // Check if category exists and belongs to the family
            const category = await prisma.category.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                },
                include: {
                    children: {
                        where: { deletedAt: null },
                        select: { id: true }
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

            // Check if category has children
            if (category.children.length > 0) {
                return { ok: false, error: "Cannot delete category with subcategories. Delete subcategories first." };
            }

            // Check if category is being used by transactions
            if (category.transactions.length > 0) {
                return { ok: false, error: "Cannot delete category that is being used by transactions" };
            }

            // Soft delete category
            await prisma.category.update({
                where: { id: input.id },
                data: {
                    deletedAt: getCurrentDateTime(),
                    updatedAt: getCurrentDateTime()
                }
            });

            return { ok: true };

        } catch (error) {
            console.error('Error deleting category:', error);
            return { ok: false, error: "Failed to delete category" };
        }
    }
});

export const restoreCategory = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().transform(val => parseInt(val))
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

            // Check if category exists and belongs to the family
            const category = await prisma.category.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: { not: null }
                }
            });

            if (!category) {
                return { ok: false, error: "Deleted category not found" };
            }

            // Check if a category with the same name already exists
            const nameConflict = await prisma.category.findFirst({
                where: {
                    familyId: userWithFamily.familyId,
                    name: category.name,
                    deletedAt: null,
                    id: { not: input.id }
                }
            });

            if (nameConflict) {
                return { ok: false, error: "A category with this name already exists" };
            }

            // Restore category
            await prisma.category.update({
                where: { id: input.id },
                data: {
                    deletedAt: null,
                    updatedAt: getCurrentDateTime()
                }
            });

            return { ok: true };

        } catch (error) {
            console.error('Error restoring category:', error);
            return { ok: false, error: "Failed to restore category" };
        }
    }
});
