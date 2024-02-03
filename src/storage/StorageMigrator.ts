import { type Storage } from "@/storage/Storage";
import { Logging } from "@/logger/Logging";

const logger = Logging.getLogger("StorageMigrator");

/**
 * Migrates data from one storage to the other.
 * Any data present in the target storage will be overwritten.
 */
export class StorageMigrator {
    public async migrate<T>(
        source: Storage<T>,
        target: Storage<T>,
    ): Promise<void> {
        logger.info("Migrating storage");

        const data = await source.load();

        if (data) {
            await target.save(data);
        } else {
            logger.debug("No data to be migrated");
            await target.clear();
        }

        await source.clear();

        logger.debug("Successfully migrated storage");
    }
}
