import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

const createTag = defineAction({
    accept: 'form',
    input: z.object({
        name: z.string().trim().min(1, "Tag name is required"),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#e99537")
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
                return { ok: false, error: "User must belong to a family to create tags" };
            }

            // Check if tag name already exists in family
            const existingTag = await prisma.tag.findFirst({
                where: {
                    familyId: userWithFamily.familyId,
                    name: input.name,
                    deletedAt: null
                }
            });

            if (existingTag) {
                return { ok: false, error: "A tag with this name already exists" };
            }

            // Create tag
            const tag = await prisma.tag.create({
                data: {
                    familyId: userWithFamily.familyId,
                    name: input.name,
                    color: input.color,
                    createdAt: getCurrentDateTime(),
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
            console.error('Error creating tag:', error);
            return { ok: false, error: "Failed to create tag" };
        }
    }
});

export { createTag };
