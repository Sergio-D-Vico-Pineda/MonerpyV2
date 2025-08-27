import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import { prisma } from '@prisma/index.js';
import { getCurrentDateTime } from '@lib/date-utils.ts';

function parseIds(raw: string): number[] {
    if (!raw) return [];
    return Array.from(new Set(raw.split(/[\s,]+/).filter(Boolean).map(v => parseInt(v, 10)).filter(n => Number.isFinite(n) && n > 0)));
}

const MAX_BULK = 10;
interface Skipped { id: number; name?: string; reason: string; }

const bulkRestoreAccounts = defineAction({
    accept: 'form',
    input: z.object({ ids: z.string().trim().min(1) }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) return { ok: false, error: 'Authentication required' };
            const userWithFamily = await prisma.user.findUnique({ where: { id: user.id }, include: { family: true } });
            if (!userWithFamily?.familyId) return { ok: false, error: 'User must belong to a family' };
            const ids = parseIds(input.ids).slice(0, MAX_BULK);
            if (!ids.length) return { ok: false, error: 'No valid ids provided' };

            const accounts = await prisma.account.findMany({ where: { id: { in: ids }, familyId: userWithFamily.familyId }, select: { id: true, name: true, deletedAt: true } });
            const activeAccounts = await prisma.account.findMany({ where: { familyId: userWithFamily.familyId, deletedAt: null }, select: { id: true, name: true } });
            const activeNameMap = new Map(activeAccounts.map(a => [a.name.toLowerCase(), a.id]));
            const map = new Map(accounts.map(a => [a.id, a]));
            const toRestore: number[] = [];
            const skipped: Skipped[] = [];
            for (const id of ids) {
                const acc = map.get(id);
                if (!acc) { skipped.push({ id, reason: 'not_found' }); continue; }
                if (!acc.deletedAt) { skipped.push({ id, name: acc.name, reason: 'not_deleted_anymore' }); continue; }
                const conflict = activeNameMap.get(acc.name.toLowerCase());
                if (conflict && conflict !== acc.id) { skipped.push({ id, name: acc.name, reason: 'name_conflict' }); continue; }
                toRestore.push(id);
            }
            if (!toRestore.length) return { ok: true, restored: 0, skipped };
            await prisma.account.updateMany({ where: { id: { in: toRestore } }, data: { deletedAt: null, updatedAt: getCurrentDateTime() } });
            console.log(`[bulkRestoreAccounts] Restored ${toRestore.length}`);
            return { ok: true, restored: toRestore.length, skipped };
        } catch (e) {
            console.error('Error bulk restoring accounts:', e);
            return { ok: false, error: 'Failed to bulk restore accounts' };
        }
    }
});

const bulkPurgeAccounts = defineAction({
    accept: 'form',
    input: z.object({ ids: z.string().trim().min(1) }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) return { ok: false, error: 'Authentication required' };
            const userWithFamily = await prisma.user.findUnique({ where: { id: user.id }, include: { family: true } });
            if (!userWithFamily?.familyId) return { ok: false, error: 'User must belong to a family' };
            const ids = parseIds(input.ids).slice(0, MAX_BULK);
            if (!ids.length) return { ok: false, error: 'No valid ids provided' };
            const accounts = await prisma.account.findMany({ where: { id: { in: ids }, familyId: userWithFamily.familyId }, select: { id: true, name: true, deletedAt: true } });
            const map = new Map(accounts.map(a => [a.id, a]));
            const toDelete: number[] = [];
            const skipped: Skipped[] = [];
            for (const id of ids) {
                const acc = map.get(id);
                if (!acc) { skipped.push({ id, reason: 'not_found' }); continue; }
                if (!acc.deletedAt) { skipped.push({ id, name: acc.name, reason: 'not_deleted_anymore' }); continue; }
                toDelete.push(id);
            }
            if (!toDelete.length) return { ok: true, purged: 0, skipped };
            await prisma.$transaction(async tx => {
                await tx.accountBalance.deleteMany({ where: { accountId: { in: toDelete } } });
                await tx.transaction.deleteMany({ where: { accountId: { in: toDelete } } });
                await tx.recurringTransaction.deleteMany({ where: { accountId: { in: toDelete } } });
                await tx.account.deleteMany({ where: { id: { in: toDelete } } });
            });
            console.log(`[bulkPurgeAccounts] Purged ${toDelete.length}`);
            return { ok: true, purged: toDelete.length, skipped };
        } catch (e) {
            console.error('Error bulk purging accounts:', e);
            return { ok: false, error: 'Failed to bulk purge accounts' };
        }
    }
});

export { bulkRestoreAccounts, bulkPurgeAccounts };
