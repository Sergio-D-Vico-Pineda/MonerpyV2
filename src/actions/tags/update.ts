import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

export const updateTag = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().transform(val => parseInt(val)),
        name: z.string().trim().min(1, "Tag name is required"),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
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

            // Check if tag exists and belongs to the family
            const existingTag = await prisma.tag.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                }
            });

            if (!existingTag) {
                return { ok: false, error: "Tag not found" };
            }

            // Check if name already exists (excluding current tag)
            const nameConflict = await prisma.tag.findFirst({
                where: {
                    familyId: userWithFamily.familyId,
                    name: input.name,
                    deletedAt: null,
                    id: { not: input.id }
                }
            });

            if (nameConflict) {
                return { ok: false, error: "A tag with this name already exists" };
            }

            // Update tag
            const tag = await prisma.tag.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    color: input.color,
                    updatedAt: getCurrentDateTime()
                }
            });

            return {
                ok: true,
                tag: {
                    id: tag.id,
                    name: tag.name,
                    color: tag.color
                }
            };

        } catch (error) {
            console.error('Error updating tag:', error);
            return { ok: false, error: "Failed to update tag" };
        }
    }
});
