import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

const deleteTag = defineAction({
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

            // Check if tag exists and belongs to the family
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

            // Check if tag is being used by transactions
            if (tag.transactions.length > 0) {
                return { ok: false, error: "Cannot delete tag that is being used by transactions" };
            }

            // Soft delete tag
            await prisma.tag.update({
                where: { id: input.id },
                data: {
                    deletedAt: getCurrentDateTime(),
                    updatedAt: getCurrentDateTime()
                }
            });

            return { ok: true };

        } catch (error) {
            console.error('Error deleting tag:', error);
            return { ok: false, error: "Failed to delete tag" };
        }
    }
});

const restoreTag = defineAction({
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

            // Check if tag exists and belongs to the family
            const tag = await prisma.tag.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: { not: null }
                }
            });

            if (!tag) {
                return { ok: false, error: "Deleted tag not found" };
            }

            // Check if a tag with the same name already exists
            const nameConflict = await prisma.tag.findFirst({
                where: {
                    familyId: userWithFamily.familyId,
                    name: tag.name,
                    deletedAt: null,
                    id: { not: input.id }
                }
            });

            if (nameConflict) {
                return { ok: false, error: "A tag with this name already exists" };
            }

            // Restore tag
            await prisma.tag.update({
                where: { id: input.id },
                data: {
                    deletedAt: null,
                    updatedAt: getCurrentDateTime()
                }
            });

            return { ok: true };

        } catch (error) {
            console.error('Error restoring tag:', error);
            return { ok: false, error: "Failed to restore tag" };
        }
    }
});

export {
    deleteTag,
    restoreTag
};