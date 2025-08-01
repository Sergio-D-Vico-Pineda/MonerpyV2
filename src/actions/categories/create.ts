import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

export const createCategory = defineAction({
    accept: 'form',
    input: z.object({
        name: z.string().trim().min(1, "Category name is required"),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#6172F3"),
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
                return { ok: false, error: "User must belong to a family to create categories" };
            }

            // Check if category name already exists in family
            const existingCategory = await prisma.category.findFirst({
                where: {
                    familyId: userWithFamily.familyId,
                    name: input.name,
                    deletedAt: null
                }
            });

            if (existingCategory) {
                return { ok: false, error: "A category with this name already exists" };
            }

            // If parentId is provided, verify it exists and belongs to the same family
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
            }

            // Create category
            const category = await prisma.category.create({
                data: {
                    familyId: userWithFamily.familyId,
                    name: input.name,
                    color: input.color,
                    parentId: input.parentId,
                    createdAt: getCurrentDateTime(),
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
            console.error('Error creating category:', error);
            return { ok: false, error: "Failed to create category" };
        }
    }
});
