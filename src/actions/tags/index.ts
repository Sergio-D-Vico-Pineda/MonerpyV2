import { createTag } from "./create.ts";
import { getTags, getTag } from "./read.ts";
import { updateTag } from "./update.ts";
import { deleteTag, restoreTag, purgeTag } from "./delete.ts";
import { bulkRestoreTags, bulkPurgeTags } from "./bulk.ts";

export {
    createTag,
    getTags,
    getTag,
    updateTag,
    deleteTag,
    restoreTag,
    purgeTag,
    bulkRestoreTags,
    bulkPurgeTags
};
