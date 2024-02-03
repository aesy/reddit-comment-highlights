import { Logging } from "@/logger/Logging";
import { type Storage } from "@/storage/Storage";
import { currentTimestampSeconds, wait } from "@/util/Time";

const logger = Logging.getLogger("ThreadHistory");

export interface ThreadHistoryEntry {
    id: string;
    timestamp: number;
}

export class ThreadHistory {
    private static readonly SAVE_RETRY_TIMEOUT_SECONDS = 5;

    public constructor(
        public readonly storage: Storage<ThreadHistoryEntry[]>,
        public readonly threadRemovalSeconds: number,
    ) {}

    public async get(id: string): Promise<ThreadHistoryEntry | null> {
        logger.debug("Fetching thread", { threadId: id });

        const threads = await this.storage.load();

        if (!threads) {
            logger.debug("No thread found", {
                threadId: id,
                reason: "Storage is empty",
            });

            return null;
        }

        const index = ThreadHistory.getIndex(threads, id);

        if (index === -1) {
            logger.debug("No thread found", { threadId: id });

            return null;
        }

        const thread = threads[index];

        logger.debug("Thread found", {
            threadId: id,
            timestamp: new Date(thread.timestamp * 1000).toISOString(),
        });

        return thread;
    }

    public async add(id: string): Promise<void> {
        logger.debug("Adding thread", { threadId: id });

        const threads = await this.storage.load();
        const data: ThreadHistoryEntry[] = [];

        if (threads) {
            data.push(...threads);
        }

        const index = ThreadHistory.getIndex(threads, id);

        if (index > -1) {
            logger.debug("Thread already present, replacing it", {
                threadId: id,
            });

            data.splice(index, 1);
        }

        data.push({
            id,
            timestamp: currentTimestampSeconds(),
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

        const i = ThreadHistory.getIndex(data, id);

        if (i > -1) {
            data.splice(i, 1);
        } else {
            logger.debug("Removing not possible", {
                threadId: id,
                reason: "Thread not present",
            });

            return;
        }

        await this.save(data);

        logger.debug("Thread successfully removed", { threadId: id });
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing ThreadHistory");

        await this.storage.clear();
    }

    private static getIndex(
        threads: ThreadHistoryEntry[] | null,
        id: string,
    ): number {
        if (!threads) {
            return -1;
        }

        for (let i = 0; i < threads.length; i++) {
            const thread = threads[i];

            if (thread.id === id) {
                return i;
            }
        }

        return -1;
    }

    private static getOldest(
        threads: ThreadHistoryEntry[],
    ): ThreadHistoryEntry | null {
        if (!threads) {
            return null;
        }

        // Array is sorted
        return threads[0];
    }

    private static removeThread(
        threads: ThreadHistoryEntry[],
        thread: ThreadHistoryEntry,
    ): ThreadHistoryEntry[] {
        const index = ThreadHistory.getIndex(threads, thread.id);

        if (index > -1) {
            threads.splice(index, 1);
        }

        return threads;
    }

    private async save(data: ThreadHistoryEntry[] | null): Promise<void> {
        logger.debug("Saving ThreadHistory", {
            length: String((data || []).length),
        });

        data = this.cleanup(data);

        try {
            await this.storage.save(data);
        } catch (error) {
            if (!data || data.length === 0) {
                // History is empty, error not related to any limits
                logger.error("Failed to save to storage", {
                    error: JSON.stringify(error),
                });

                throw error;
            }

            const delay = ThreadHistory.SAVE_RETRY_TIMEOUT_SECONDS * 1000;

            // An error occurred, probably due to some limit exceeded
            logger.warn(
                "Failed to save to storage, truncating data and trying again",
                { delay: String(delay), error: JSON.stringify(error) },
            );

            // Remove half and try again
            const middle = Math.ceil(data.length / 2);
            for (let i = 0; i < middle; i++) {
                const thread = ThreadHistory.getOldest(data);
                data = ThreadHistory.removeThread(data, thread!);
            }

            await wait(delay);
            await this.save(data);
        }
    }

    private cleanup(
        data: ThreadHistoryEntry[] | null,
    ): ThreadHistoryEntry[] | null {
        if (data === null) {
            return null;
        }

        let count = 0;

        while (true) {
            const thread = ThreadHistory.getOldest(data);

            if (!thread) {
                break;
            }

            if (
                thread.timestamp <
                currentTimestampSeconds() - this.threadRemovalSeconds
            ) {
                count++;
                data = ThreadHistory.removeThread(data, thread);
            } else {
                break;
            }
        }

        logger.debug("Cleaned up ThreadHistory", { removed: String(count) });

        return data;
    }

    public dispose(): void {
        this.storage.dispose();
    }
}
