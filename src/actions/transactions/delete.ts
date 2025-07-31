import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';

export const deleteTransaction = defineAction({
    accept: 'form',
    input: z.object({
        id: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), "Transaction ID is required")
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
                return { ok: false, error: "User must belong to a family to delete transactions" };
            }

            // Get existing transaction for balance calculation
            const existingTransaction = await prisma.transaction.findFirst({
                where: {
                    id: input.id,
                    deletedAt: null,
                    account: {
                        familyId: userWithFamily.familyId,
                        deletedAt: null
                    }
                }
            });

            if (!existingTransaction) {
                return { ok: false, error: "Transaction not found or not accessible" };
            }

            // Soft delete the transaction
            await prisma.transaction.update({
                where: { id: input.id },
                data: {
                    deletedAt: new Date()
                }
            });

            // Reverse the transaction's effect on account balance
            const balanceChange = existingTransaction.type === 'Income' ? -existingTransaction.amount : existingTransaction.amount;
            await prisma.account.update({
                where: { id: existingTransaction.accountId },
                data: {
                    balance: {
                        increment: balanceChange
                    }
                }
            });

            return { ok: true };

        } catch (error) {
            console.error("Error deleting transaction:", error);
            return { ok: false, error: "Failed to delete transaction" };
        }
    }
});
