import { Storage } from "storage/Storage";

/**
 * Migrates data from one storage to the other.
 * Any data present in the target storage will be overwritten.
 */
export class StorageMigrator {
    public async migrate<T>(source: Storage<T>, target: Storage<T>): Promise<void> {
        const data = await source.load();

        if (data) {
            await target.save(data);
        } else {
            await target.clear();
        }

        await source.clear();
    }
}
