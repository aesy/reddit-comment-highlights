import bind from "bind-decorator";
import { currentTimestampSeconds } from "util/Time";
import { Subscribable, Event } from "event/Event";
import { Storage } from "storage/Storage";

export interface ThreadHistoryEntry {
    id: string,
    timestamp: number
}

export interface ThreadHistory {
    readonly onChange: Subscribable<void>

    get(id: string): Promise<ThreadHistoryEntry | null>
    add(id: string): Promise<void>
    remove(id: string): Promise<void>
    clear(): Promise<void>
    dispose(): void
}

export class TruncatingThreadHistory implements ThreadHistory {
    private static readonly SAVE_RETRY_TIMEOUT_SECONDS = 5;
    private readonly _onChange: Event<void> = new Event();
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
        const threads = await this.storage.load();

        if (!threads) {
            return null;
        }

        const index = TruncatingThreadHistory.getIndex(threads, id);

        if (index === -1) {
            return null;
        }

        return threads[ index ];
    }

    public async add(id: string): Promise<void> {
        const threads = await this.storage.load();
        const data: ThreadHistoryEntry[] = [];

        if (threads) {
            data.push(...threads);
        }

        const index = TruncatingThreadHistory.getIndex(threads, id);

        if (index > -1) {
            data.splice(index, 1);
        }

        data.push({
            id,
            timestamp: currentTimestampSeconds()
        });

        await this.save(data);
    }

    public async remove(id: string): Promise<void> {
        const threads = await this.storage.load();

        const data: ThreadHistoryEntry[] = [];

        if (threads) {
            data.push(...threads);
        }

        const i = TruncatingThreadHistory.getIndex(data, id);

        if (i > -1) {
            data.splice(i, 1);
        }

        await this.save(data);
    }

    public async clear(): Promise<void> {
        await this.storage.clear();
    }

    public dispose(): void {
        this.storage.onChange.unsubscribe(this.onStorageChange);
        this._onChange.dispose();
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
                console.log("Failed to save thread history", error);

                throw error;
            }

            // An error occurred, probably due to some limit exceeded
            // Remove oldest thread and try again
            const thread = TruncatingThreadHistory.getOldest(data);
            data = TruncatingThreadHistory.removeThread(data, thread!);

            await new Promise(resolve => {
                this.saveTimeout = window.setTimeout(() => {
                    this.saveTimeout = null;
                    resolve();
                }, TruncatingThreadHistory.SAVE_RETRY_TIMEOUT_SECONDS * 1000);
            });

            await this.save(data);
        }
    }

    private cleanup(data: ThreadHistoryEntry[] | null): ThreadHistoryEntry[] | null {
        if (!data) {
            return null;
        }

        while (true) {
            const thread = TruncatingThreadHistory.getOldest(data);

            if (!thread) {
                return data;
            }

            if (thread.timestamp < (currentTimestampSeconds() - this.threadRemovalSeconds)) {
                data = TruncatingThreadHistory.removeThread(data, thread);
            } else {
                return data;
            }
        }
    }

    @bind
    private onStorageChange(): void {
        this._onChange.dispatch();
    }
}
