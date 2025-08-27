import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

// Helpers
function parseIds(raw: string): number[] {
    if (!raw) return [];
    return Array.from(new Set(
        raw.split(/[,\s]+/)
            .map(v => v.trim())
            .filter(v => v.length > 0)
            .map(v => parseInt(v, 10))
            .filter(n => Number.isFinite(n) && n > 0)
    ));
}

const MAX_BULK = 10;

interface SkippedItem { id: number; name?: string; reason: string; }

const bulkPurgeCategories = defineAction({
    accept: 'form',
    input: z.object({
        ids: z.string().trim().min(1, "At least one id is required")
    }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) {
                return { ok: false, error: "Authentication required." };
            }

            const userWithFamily = await prisma.user.findUnique({
                where: { id: user.id },
                include: { family: true }
            });
            if (!userWithFamily?.familyId) {
                return { ok: false, error: "User must belong to a family." };
            }

            const ids = parseIds(input.ids).slice(0, MAX_BULK);
            if (ids.length === 0) {
                return { ok: false, error: "No valid ids provided." };
            }

            // Fetch candidate categories (still soft-deleted)
            const categories = await prisma.category.findMany({
                where: {
                    id: { in: ids },
                    familyId: userWithFamily.familyId
                },
                select: { id: true, name: true, deletedAt: true }
            });

            const categoryMap = new Map(categories.map(c => [c.id, c]));
            const validIds: number[] = [];
            const skipped: SkippedItem[] = [];

            for (const id of ids) {
                const c = categoryMap.get(id);
                if (!c) {
                    skipped.push({ id, reason: 'not_found' });
                    continue;
                }
                if (!c.deletedAt) {
                    skipped.push({ id, name: c.name, reason: 'not_deleted_anymore' });
                    continue;
                }
                validIds.push(id);
            }

            if (validIds.length === 0) {
                return { ok: true, purged: 0, skipped };
            }

            await prisma.$transaction(async (tx) => {
                // Null references in transactions
                await tx.transaction.updateMany({
                    where: { categoryId: { in: validIds } },
                    data: { categoryId: null }
                });
                // Null references in recurring transactions
                await tx.recurringTransaction.updateMany({
                    where: { categoryId: { in: validIds } },
                    data: { categoryId: null }
                });
                // Orphan any children of purged categories that aren't themselves being purged
                await tx.category.updateMany({
                    where: { parentId: { in: validIds }, id: { notIn: validIds } },
                    data: { parentId: null }
                });
                // Delete
                await tx.category.deleteMany({
                    where: { id: { in: validIds } }
                });
            });

            console.log(`[bulkPurgeCategories] Purged ${validIds.length} categories (requested ${ids.length}).`);

            return { ok: true, purged: validIds.length, skipped };
        } catch (error) {
            console.error('Error bulk purging categories:', error);
            return { ok: false, error: "Failed to bulk purge categories." };
        }
    }
});

const bulkRestoreCategories = defineAction({
    accept: 'form',
    input: z.object({
        ids: z.string().trim().min(1, "At least one id is required")
    }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) {
                return { ok: false, error: "Authentication required." };
            }

            const userWithFamily = await prisma.user.findUnique({
                where: { id: user.id },
                include: { family: true }
            });
            if (!userWithFamily?.familyId) {
                return { ok: false, error: "User must belong to a family." };
            }

            const ids = parseIds(input.ids).slice(0, MAX_BULK);
            if (ids.length === 0) {
                return { ok: false, error: "No valid ids provided." };
            }

            // Fetch candidate categories
            const categories = await prisma.category.findMany({
                where: { id: { in: ids }, familyId: userWithFamily.familyId },
                select: { id: true, name: true, parentId: true, deletedAt: true }
            });
            const nameConflictsActive = await prisma.category.findMany({
                where: {
                    familyId: userWithFamily.familyId,
                    deletedAt: null
                },
                select: { id: true, name: true }
            });
            const activeNameSet = new Map(nameConflictsActive.map(c => [c.name.toLowerCase(), c.id]));

            const categoryMap = new Map(categories.map(c => [c.id, c]));
            const valid: { id: number; name: string; parentId: number | null }[] = [];
            const skipped: SkippedItem[] = [];

            for (const id of ids) {
                const c = categoryMap.get(id);
                if (!c) {
                    skipped.push({ id, reason: 'not_found' });
                    continue;
                }
                if (!c.deletedAt) {
                    skipped.push({ id, name: c.name, reason: 'not_deleted_anymore' });
                    continue;
                }
                const conflictId = activeNameSet.get(c.name.toLowerCase());
                if (conflictId && conflictId !== c.id) {
                    skipped.push({ id, name: c.name, reason: 'name_conflict' });
                    continue;
                }
                let newParentId = c.parentId;
                if (newParentId) {
                    // Parent must exist, be not deleted and not among those still deleted
                    const parent = await prisma.category.findFirst({
                        where: { id: newParentId, familyId: userWithFamily.familyId, deletedAt: null },
                        select: { id: true }
                    });
                    if (!parent) newParentId = null;
                }
                valid.push({ id: c.id, name: c.name, parentId: newParentId ?? null });
            }

            if (valid.length === 0) {
                return { ok: true, restored: 0, skipped };
            }

            await prisma.$transaction(async (tx) => {
                for (const v of valid) {
                    await tx.category.update({
                        where: { id: v.id },
                        data: {
                            deletedAt: null,
                            updatedAt: getCurrentDateTime(),
                            parentId: v.parentId
                        }
                    });
                }
            });

            console.log(`[bulkRestoreCategories] Restored ${valid.length} categories (requested ${ids.length}).`);

            return { ok: true, restored: valid.length, skipped };
        } catch (error) {
            console.error('Error bulk restoring categories:', error);
            return { ok: false, error: "Failed to bulk restore categories." };
        }
    }
});

export {
    bulkPurgeCategories,
    bulkRestoreCategories
};
