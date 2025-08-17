import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { prisma } from '@prisma/index.js';

const getUser = defineAction({
    accept: 'json',
    input: z.object({
        id: z.number().int().positive()
    }),
    handler: async (input, context) => {
        const user = await prisma.user.findUnique({
            where: { id: input.id },
            select: {
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                lastLogin: true,
                _count: {
                    select: {
                        transactions: true,
                        recurringTransactions: true
                    }
                }
            }
        });
        if (!user) {
            return { ok: false, error: "User not found" };
        }
        return { ok: true, user };
    }
});

export { getUser };