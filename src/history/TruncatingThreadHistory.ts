import bind from "bind-decorator";
import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { Storage } from "storage/Storage";
import { ThreadHistory, ThreadHistoryEntry } from "history/ThreadHistory";
import { currentTimestampSeconds } from "util/Time";
import { Logging } from "logger/Logging";

const logger = Logging.getLogger("TruncatingThreadHistory");

export class TruncatingThreadHistory implements ThreadHistory {
    private static readonly SAVE_RETRY_TIMEOUT_SECONDS = 5;
    private readonly _onChange = new SyncEvent<void>();
    private saveTimeout: number | null = null;

    public constructor(
        private readonly storage: Storage<ThreadHistoryEntry[]>,
        private readonly threadRemovalSeconds: number
    ) {
        storage.onChange.subscribe(this.onStorageChange);
    }

    public get onChange(): Subscribable<void> {
        return this._onChange;
    }

    public async get(id: string): Promise<ThreadHistoryEntry | null> {
        logger.debug("Fetching thread", { threadId: id });

        const threads = await this.storage.load();

        if (!threads) {
            logger.debug("No thread found", { threadId: id, reason: "Storage is empty" });

            return null;
        }

        const index = TruncatingThreadHistory.getIndex(threads, id);

        if (index === -1) {
            logger.debug("No thread found", { threadId: id });

            return null;
        }

        logger.debug("Thread found", { threadId: id });

        return threads[ index ];
    }

    public async add(id: string): Promise<void> {
        logger.debug("Adding thread", { threadId: id });

        const threads = await this.storage.load();
        const data: ThreadHistoryEntry[] = [];

        if (threads) {
            data.push(...threads);
        }

        const index = TruncatingThreadHistory.getIndex(threads, id);

        if (index > -1) {
            logger.debug("Thread already present, replacing it", { threadId: id });

            data.splice(index, 1);
        }

        data.push({
            id,
            timestamp: currentTimestampSeconds()
        });

        await this.save(data);

        logger.debug("Thread successfully added", { threadId: id });
    }

    public async remove(id: string): Promise<void> {
        logger.debug("Removing thread", { threadId: id });

        const threads = await this.storage.load();

        const data: ThreadHistoryEntry[] = [];

        if (threads) {
            data.push(...threads);
        }

        const i = TruncatingThreadHistory.getIndex(data, id);

        if (i > -1) {
            data.splice(i, 1);
        } else {
            logger.debug("Removing not possible", { threadId: id, reason: "Thread not present" });

            return;
        }

        await this.save(data);

        logger.debug("Thread successfully removed", { threadId: id });
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing ThreadHistory");

        await this.storage.clear();
    }

    public dispose(): void {
        logger.debug("Disposing ThreadHistory");

        this._onChange.dispose();
        this.storage.dispose();
    }

    private static getIndex(threads: ThreadHistoryEntry[] | null, id: string): number {
        if (!threads) {
            return -1;
        }

        for (let i = 0; i < threads.length; i++) {
            const thread = threads[ i ];

            if (thread.id === id) {
                return i;
            }
        }

        return -1;
    }

    private static getOldest(threads: ThreadHistoryEntry[]): ThreadHistoryEntry | null {
        if (!threads) {
            return null;
        }

        // Array is sorted
        return threads[ 0 ];
    }

    private static removeThread(
        threads: ThreadHistoryEntry[],
        thread: ThreadHistoryEntry
    ): ThreadHistoryEntry[] {
        const index = TruncatingThreadHistory.getIndex(threads, thread.id);

        if (index > -1) {
            threads.splice(index, 1);
        }

        return threads;
    }

    private async save(data: ThreadHistoryEntry[] | null): Promise<void> {
        logger.debug("Saving ThreadHistory", { length: String((data || []).length) });

        if (this.saveTimeout) {
            window.clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }

        data = this.cleanup(data);

        try {
            await this.storage.save(data);
        } catch (error) {
            if (!data) {
                // History is empty, error not related to any limits
                logger.error("Failed to save to storage", { error: JSON.stringify(error) });

                throw error;
            }

            const delay = TruncatingThreadHistory.SAVE_RETRY_TIMEOUT_SECONDS * 1000;

            // An error occurred, probably due to some limit exceeded
            // Remove oldest thread and try again
            logger.warn("Failed to save to storage, truncating data and trying again",
                { delay: String(delay), error: JSON.stringify(error) });

            const thread = TruncatingThreadHistory.getOldest(data);
            data = TruncatingThreadHistory.removeThread(data, thread!);

            await new Promise(resolve => {
                this.saveTimeout = window.setTimeout(() => {
                    this.saveTimeout = null;
                    resolve();
                }, delay);
            });

            await this.save(data);
        }
    }

    private cleanup(data: ThreadHistoryEntry[] | null): ThreadHistoryEntry[] | null {
        if (!data) {
            return null;
        }

        let count = 0;

        while (true) {
            const thread = TruncatingThreadHistory.getOldest(data);

            if (!thread) {
                break;
            }

            if (thread.timestamp < (currentTimestampSeconds() - this.threadRemovalSeconds)) {
                count++;
                data = TruncatingThreadHistory.removeThread(data, thread);
            } else {
                break;
            }
        }

        logger.debug("Cleaned up ThreadHistory", { removed: String(count) });

        return data;
    }

    @bind
    private onStorageChange(): void {
        logger.debug("ThreadHistory underlying storage changed");

        this._onChange.dispatch();
    }
}
