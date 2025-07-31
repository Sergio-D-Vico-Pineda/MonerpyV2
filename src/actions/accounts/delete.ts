import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '../../lib/date-utils.js';

export const deleteAccount = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), "Account ID is required")
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

            // Verify account belongs to user's family and exists
            const existingAccount = await prisma.account.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                }
            });

            if (!existingAccount) {
                return { ok: false, error: "Account not found or not accessible" };
            }

            // Soft delete account
            const deletedAccount = await prisma.account.update({
                where: { id: input.id },
                data: {
                    deletedAt: getCurrentDateTime(),
                    updatedAt: getCurrentDateTime()
                }
            });

            return { ok: true, account: deletedAccount };

        } catch (error) {
            console.error("Error deleting account:", error);
            return { ok: false, error: "Failed to delete account" };
        }
    }
});

export const restoreAccount = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), "Account ID is required")
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

            // Verify account belongs to user's family and is deleted
            const existingAccount = await prisma.account.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId,
                    deletedAt: { not: null }
                }
            });

            if (!existingAccount) {
                return { ok: false, error: "Account not found or not deleted" };
            }

            // Check if name conflicts with active accounts
            const nameConflict = await prisma.account.findFirst({
                where: {
                    familyId: userWithFamily.familyId,
                    name: existingAccount.name,
                    deletedAt: null,
                    id: { not: input.id }
                }
            });

            if (nameConflict) {
                return { ok: false, error: "Cannot restore: An active account with this name already exists" };
            }

            // Restore account
            const restoredAccount = await prisma.account.update({
                where: { id: input.id },
                data: {
                    deletedAt: null,
                    updatedAt: getCurrentDateTime()
                }
            });

            return { ok: true, account: restoredAccount };

        } catch (error) {
            console.error("Error restoring account:", error);
            return { ok: false, error: "Failed to restore account" };
        }
    }
});
