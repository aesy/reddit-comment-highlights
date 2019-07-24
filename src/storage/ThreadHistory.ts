import bind from "bind-decorator";
import { currentTimestampSeconds } from "util/Time";
import { Subscribable, Event } from "event/Event";
import { Storage } from "storage/Storage";

export interface ThreadHistoryEntry {
    id: string,
    timestamp: number
}

export class ThreadHistory {
    private static readonly SAVE_RETRY_TIMEOUT_SECONDS = 5;
    private readonly _onChange: Event<void> = new Event();
    private cache: ThreadHistoryEntry[] = [];
    private saveTimeout: number | null = null;

    public constructor(
        private readonly storage: Storage<ThreadHistoryEntry[]>,
        private readonly threadRemovalSeconds: number
    ) {
        // Listen for changes in storage and update internal cache
        storage.onChange.subscribe(this.onStorageChange);

        // Sync internal cache with storage
        storage.load().then(this.onStorageChange);
    }

    public get onChange(): Subscribable<void> {
        return this._onChange;
    }

    public get(id: string): ThreadHistoryEntry | null {
        const i = this.getIndex(id);

        if (i > -1) {
            return this.cache[ i ];
        }

        return null;
    }

    public add(id: string): this {
        this.remove(id);

        this.cache.push({
            id,
            timestamp: currentTimestampSeconds()
        });

        this.save();

        return this;
    }

    public remove(id: string): this {
        const i = this.getIndex(id);

        if (i > -1) {
            this.cache.splice(i, 1);
        }

        this.save();

        return this;
    }

    public async clear(): Promise<void> {
        this.cache = [];

        await this.storage.clear();
    }

    public dispose(): void {
        this.storage.onChange.unsubscribe(this.onStorageChange);
        this._onChange.dispose();
    }

    private getIndex(id: string): number {
        for (let i = 0; i < this.cache.length; i++) {
            const thread = this.cache[ i ];

            if (thread.id === id) {
                return i;
            }
        }

        return -1;
    }

    private cleanup(): void {
        while (true) {
            const thread = this.getOldest();

            if (!thread) {
                return;
            }

            if (thread.timestamp < (currentTimestampSeconds() - this.threadRemovalSeconds)) {
                this.remove(thread.id);
            } else {
                return;
            }
        }
    }

    private getOldest(): ThreadHistoryEntry | null {
        if (this.cache.length === 0) {
            return null;
        }

        // Array is sorted
        return this.cache[ 0 ];
    }

    private save(): void {
        if (this.saveTimeout) {
            window.clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }

        this.cleanup();

        this.storage.save(this.cache)
            .catch((error: any) => {
                // An error occurred, probably due to some limit exceeded
                // Remove oldest thread and try again
                const thread = this.getOldest();

                if (!thread) {
                    // History is empty, error not related to any limits
                    console.log("Failed to save thread history", error);

                    return;
                }

                this.remove(thread.id);

                this.saveTimeout = window.setTimeout(() => {
                    this.saveTimeout = null;
                    this.save();
                }, ThreadHistory.SAVE_RETRY_TIMEOUT_SECONDS * 1000);
            });
    }

    @bind
    private onStorageChange(data: ThreadHistoryEntry[] | null): void {
        this.cache = data || [];

        this._onChange.dispatch();
    }
}
