import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

const updateAccount = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), "Account ID is required"),
        name: z.string().trim().min(1, "Account name is required"),
        accountType: z.enum(['Cash', 'Checking', 'Savings', 'CreditCard', 'Investment', 'Loan']),
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

            // Check if new name conflicts with other accounts
            if (input.name !== existingAccount.name) {
                const nameConflict = await prisma.account.findFirst({
                    where: {
                        familyId: userWithFamily.familyId,
                        name: input.name,
                        deletedAt: null,
                        id: { not: input.id }
                    }
                });

                if (nameConflict) {
                    return { ok: false, error: "An account with this name already exists" };
                }
            }

            // Update account
            const updatedAccount = await prisma.account.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    accountType: input.accountType,
                    color: input.color,
                    updatedAt: getCurrentDateTime()
                }
            });

            return { ok: true, account: updatedAccount };

        } catch (error) {
            console.error("Error updating account:", error);
            return { ok: false, error: "Failed to update account" };
        }
    }
});

export { updateAccount };