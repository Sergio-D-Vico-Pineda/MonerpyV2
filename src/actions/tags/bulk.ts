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

const bulkRestoreTags = defineAction({
    accept: 'form',
    input: z.object({ ids: z.string().trim().min(1) }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) return { ok: false, error: 'Authentication required' };
            const userWithFamily = await prisma.user.findUnique({ where: { id: user.id }, include: { family: true } });
            if (!userWithFamily?.familyId) return { ok: false, error: 'User must belong to a family' };
            const ids = parseIds(input.ids).slice(0, MAX_BULK);
            if (ids.length === 0) return { ok: false, error: 'No valid ids provided' };
            const tags = await prisma.tag.findMany({ where: { id: { in: ids }, familyId: userWithFamily.familyId }, select: { id: true, name: true, deletedAt: true } });
            const activeNames = await prisma.tag.findMany({ where: { familyId: userWithFamily.familyId, deletedAt: null }, select: { id: true, name: true } });
            const activeNameMap = new Map(activeNames.map(t => [t.name.toLowerCase(), t.id]));
            const tagMap = new Map(tags.map(t => [t.id, t]));
            const toRestore: number[] = [];
            const skipped: Skipped[] = [];
            for (const id of ids) {
                const t = tagMap.get(id);
                if (!t) { skipped.push({ id, reason: 'not_found' }); continue; }
                if (!t.deletedAt) { skipped.push({ id, name: t.name, reason: 'not_deleted_anymore' }); continue; }
                const conflict = activeNameMap.get(t.name.toLowerCase());
                if (conflict && conflict !== t.id) { skipped.push({ id, name: t.name, reason: 'name_conflict' }); continue; }
                toRestore.push(id);
            }
            if (!toRestore.length) return { ok: true, restored: 0, skipped };
            await prisma.tag.updateMany({ where: { id: { in: toRestore } }, data: { deletedAt: null, updatedAt: getCurrentDateTime() } });
            console.log(`[bulkRestoreTags] Restored ${toRestore.length}`);
            return { ok: true, restored: toRestore.length, skipped };
        } catch (e) {
            console.error('Error bulk restoring tags:', e);
            return { ok: false, error: 'Failed to bulk restore tags' };
        }
    }
});

const bulkPurgeTags = defineAction({
    accept: 'form',
    input: z.object({ ids: z.string().trim().min(1) }),
    handler: async (input, context) => {
        try {
            const user = context.locals.user;
            if (!user) return { ok: false, error: 'Authentication required' };
            const userWithFamily = await prisma.user.findUnique({ where: { id: user.id }, include: { family: true } });
            if (!userWithFamily?.familyId) return { ok: false, error: 'User must belong to a family' };
            const ids = parseIds(input.ids).slice(0, MAX_BULK);
            if (ids.length === 0) return { ok: false, error: 'No valid ids provided' };
            const tags = await prisma.tag.findMany({ where: { id: { in: ids }, familyId: userWithFamily.familyId }, select: { id: true, name: true, deletedAt: true } });
            const tagMap = new Map(tags.map(t => [t.id, t]));
            const toDelete: number[] = [];
            const skipped: Skipped[] = [];
            for (const id of ids) {
                const t = tagMap.get(id);
                if (!t) { skipped.push({ id, reason: 'not_found' }); continue; }
                if (!t.deletedAt) { skipped.push({ id, name: t.name, reason: 'not_deleted_anymore' }); continue; }
                toDelete.push(id);
            }
            if (!toDelete.length) return { ok: true, purged: 0, skipped };
            await prisma.$transaction(async tx => {
                await tx.tag.deleteMany({ where: { id: { in: toDelete } } });
            });
            console.log(`[bulkPurgeTags] Purged ${toDelete.length}`);
            return { ok: true, purged: toDelete.length, skipped };
        } catch (e) {
            console.error('Error bulk purging tags:', e);
            return { ok: false, error: 'Failed to bulk purge tags' };
        }
    }
});

export { bulkRestoreTags, bulkPurgeTags };
