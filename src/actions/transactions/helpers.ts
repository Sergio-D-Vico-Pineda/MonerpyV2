import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';

const getAccounts = defineAction({
    accept: 'json',
    input: z.object({}).optional(),
    handler: async (_, context) => {
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

            const accounts = await prisma.account.findMany({
                where: {
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                },
                select: {
                    id: true,
                    name: true,
                    accountType: true,
                    balance: true,
                    color: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            return { ok: true, accounts };

        } catch (error) {
            console.error("Error fetching accounts:", error);
            return { ok: false, error: "Failed to fetch accounts" };
        }
    }
});

export { getAccounts };