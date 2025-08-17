import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';

const getAccounts = defineAction({
    accept: 'json',
    input: z.object({
        includeDeleted: z.boolean().optional().default(false)
    }).optional(),
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

            const whereClause = {
                familyId: userWithFamily.familyId,
                ...(input?.includeDeleted ? {} : { deletedAt: null })
            };

            const accounts = await prisma.account.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    accountType: true,
                    balance: true,
                    color: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true
                },
                orderBy: [
                    { deletedAt: 'asc' }, // Non-deleted first
                    { name: 'asc' }
                ]
            });

            return { ok: true, accounts };

        } catch (error) {
            console.error("Error fetching accounts:", error);
            return { ok: false, error: "Failed to fetch accounts" };
        }
    }
});

const getAccount = defineAction({
    accept: 'json',
    input: z.object({
        id: z.number()
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

            const account = await prisma.account.findFirst({
                where: {
                    id: input.id,
                    familyId: userWithFamily.familyId
                },
                include: {
                    transactions: {
                        where: { deletedAt: null },
                        orderBy: { date: 'desc' },
                        take: 10,
                        select: {
                            id: true,
                            name: true,
                            amount: true,
                            type: true,
                            date: true
                        }
                    },
                    accountBalances: {
                        orderBy: { date: 'desc' },
                        take: 30,
                        select: {
                            date: true,
                            balance: true,
                            cashBalance: true
                        }
                    }
                }
            });

            if (!account) {
                return { ok: false, error: "Account not found or not accessible" };
            }

            return { ok: true, account };

        } catch (error) {
            console.error("Error fetching account:", error);
            return { ok: false, error: "Failed to fetch account" };
        }
    }
});

const getAccountBalanceHistory = defineAction({
    accept: 'json',
    input: z.object({
        accountId: z.number(),
        days: z.number().optional().default(30)
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

            // Verify account belongs to user's family
            const account = await prisma.account.findFirst({
                where: {
                    id: input.accountId,
                    familyId: userWithFamily.familyId
                }
            });

            if (!account) {
                return { ok: false, error: "Account not found or not accessible" };
            }

            const balanceHistory = await prisma.accountBalance.findMany({
                where: {
                    accountId: input.accountId,
                    deletedAt: null
                },
                orderBy: { date: 'desc' },
                take: input.days,
                select: {
                    date: true,
                    balance: true,
                    cashBalance: true,
                    createdAt: true
                }
            });

            return { ok: true, balanceHistory, account: { id: account.id, name: account.name } };

        } catch (error) {
            console.error("Error fetching balance history:", error);
            return { ok: false, error: "Failed to fetch balance history" };
        }
    }
});

export {
    getAccounts,
    getAccount,
    getAccountBalanceHistory
};