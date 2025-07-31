import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { updateDailyBalance } from './helpers.ts';
import { getCurrentDateTime } from '../../lib/date-utils.js';

export const createAccount = defineAction({
    accept: 'form',
    input: z.object({
        name: z.string().trim().min(1, "Account name is required"),
        accountType: z.enum(['Cash', 'Checking', 'Savings', 'CreditCard', 'Investment', 'Loan']),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#6172F3"),
        initialBalance: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val), "Initial balance must be a valid number").default("0")
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
                return { ok: false, error: "User must belong to a family to create accounts" };
            }

            // Check if account name already exists in family
            const existingAccount = await prisma.account.findFirst({
                where: {
                    familyId: userWithFamily.familyId,
                    name: input.name,
                    deletedAt: null
                }
            });

            if (existingAccount) {
                return { ok: false, error: "An account with this name already exists" };
            }

            // Create account
            const account = await prisma.account.create({
                data: {
                    familyId: userWithFamily.familyId,
                    name: input.name,
                    accountType: input.accountType,
                    balance: input.initialBalance,
                    color: input.color,
                    createdAt: getCurrentDateTime(),
                    updatedAt: getCurrentDateTime()
                }
            });

            // Update daily balance record
            await updateDailyBalance(account.id);

            // If initial balance is not zero, create an initial transaction
            if (input.initialBalance !== 0) {
                await prisma.transaction.create({
                    data: {
                        accountId: account.id,
                        userId: user.id,
                        date: getCurrentDateTime(),
                        name: "Initial Balance",
                        amount: Math.abs(input.initialBalance),
                        type: input.initialBalance >= 0 ? 'Income' : 'Expense',
                        createdAt: getCurrentDateTime(),
                        updatedAt: getCurrentDateTime()
                    }
                });
            }

            return { ok: true, account };

        } catch (error) {
            console.error("Error creating account:", error);
            return { ok: false, error: "Failed to create account" };
        }
    }
});
