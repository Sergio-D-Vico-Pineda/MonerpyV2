import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

export const updateCategory = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().transform(val => parseInt(val)),
        name: z.string().trim().min(1, "Category name is required"),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
        parentId: z.string().nullable().transform(val => val && val !== "" ? parseInt(val) : null)
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
            const existingCategory = await prisma.category.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                }
            });

            if (!existingCategory) {
                return { ok: false, error: "Category not found" };
            }

            // Check if name already exists (excluding current category)
            const nameConflict = await prisma.category.findFirst({
                where: {
                    familyId: userWithFamily.familyId,
                    name: input.name,
                    deletedAt: null,
                    id: { not: input.id }
                }
            });

            if (nameConflict) {
                return { ok: false, error: "A category with this name already exists" };
            }

            // If parentId is provided, verify it exists and belongs to the same family
            // Also check for circular references
            if (input.parentId) {
                const parentCategory = await prisma.category.findFirst({
                    where: {
                        id: input.parentId,
                        familyId: userWithFamily.familyId,
                        deletedAt: null
                    }
                });

                if (!parentCategory) {
                    return { ok: false, error: "Parent category not found" };
                }

                // Check for circular reference (category cannot be its own parent or descendant)
                if (input.parentId === input.id) {
                    return { ok: false, error: "Category cannot be its own parent" };
                }

                // Check if parentId is a descendant of current category
                const checkCircularReference = async (categoryId: number, targetParentId: number): Promise<boolean> => {
                    const children = await prisma.category.findMany({
                        where: {
                            parentId: categoryId,
                            deletedAt: null
                        },
                        select: { id: true }
                    });

                    for (const child of children) {
                        if (child.id === targetParentId) {
                            return true;
                        }
                        if (await checkCircularReference(child.id, targetParentId)) {
                            return true;
                        }
                    }
                    return false;
                };

                if (await checkCircularReference(input.id, input.parentId)) {
                    return { ok: false, error: "Cannot create circular reference in category hierarchy" };
                }
            }

            // Update category
            const category = await prisma.category.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    color: input.color,
                    parentId: input.parentId,
                    updatedAt: getCurrentDateTime()
                }
            });

            return {
                ok: true,
                category: {
                    id: category.id,
                    name: category.name,
                    color: category.color,
                    parentId: category.parentId
                }
            };

        } catch (error) {
            console.error('Error updating category:', error);
            return { ok: false, error: "Failed to update category" };
        }
    }
});
