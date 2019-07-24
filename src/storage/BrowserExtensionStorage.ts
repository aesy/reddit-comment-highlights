import bind from "bind-decorator";
import { Subscribable, Event, AsyncEvent } from "event/Event";
import { Storage } from "storage/Storage";

declare const chrome: any | undefined;
declare const browser: any | undefined;
declare const window: any | undefined;

export enum BrowserExtensionStorageType {
    LOCAL = "local",
    SYNC = "sync"
}

export class BrowserExtensionStorage<T> implements Storage<T> {
    private readonly _onChange: Event<T> = new AsyncEvent();
    private readonly global: any;

    public constructor(
        private readonly type: BrowserExtensionStorageType,
        private readonly key: string
    ) {
        if (typeof chrome !== typeof undefined) {
            this.global = chrome;
        } else if (typeof browser !== typeof undefined) {
            this.global = browser;
        } else if (typeof window !== typeof undefined) {
            this.global = window;
        } else {
            this.global = {};
        }

        this.storage.onChanged.addListener(this.changeListener);
    }

    public get onChange(): Subscribable<T> {
        return this._onChange;
    }

    public async save(data: T): Promise<void> {
        if (!this.canSave(data)) {
            throw `Failed to save data. Reason: max byte quota exceeded (${ this.MAX_BYTES }b)`;
        }

        return new Promise<void>((resolve, reject) => {
            this.storage.set({ [ this.key ]: data }, () => {
                const error = this.global.runtime.lastError;

                if (error) {
                    return reject(error);
                }

                return resolve();
            });
        });
    }

    public load(): Promise<T | null> {
        return new Promise<T>((resolve, reject) => {
            this.storage.get(this.key, (data: { [ key: string ]: T }) => {
                const error = this.global.runtime.lastError;

                if (error) {
                    return reject(error);
                }

                return resolve(data[ this.key ]);
            });
        });
    }

    public clear(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.storage.set({ [ this.key ]: undefined }, () => {
                const error = this.global.runtime.lastError;

                if (error) {
                    return reject(error);
                }

                return resolve();
            });
        });
    }

    public dispose() {
        this.storage.onChanged.removeListener(this.changeListener);
        this._onChange.dispose();
    }

    protected get storage(): any {
        return this.global.storage[ this.type ];
    }

    /**
     * Returns the max byte size that can be saved
     */
    private get MAX_BYTES(): number {
        switch (this.type) {
            case BrowserExtensionStorageType.LOCAL:
                /*
                 * This is true for the whole storage, not this specific key.
                 * Actually, it may not even be true for the whole storage when
                 * granted the unlimitedStorage permission.
                 */
                return this.storage.QUOTA_BYTES;
            case BrowserExtensionStorageType.SYNC:
                /*
                 * QUOTA_BYTES_PER_ITEM is measured by the JSON stringification of its
                 * value plus its' key length.
                 */
                return this.storage.QUOTA_BYTES_PER_ITEM
                       // Subtract key length because it's constant
                       - this.key.length;
        }
    }

    protected canSave(data: T): boolean {
        /*
         * We can't completely rely on this comparison. It doesn't always match up with the
         * browser implementation. See the following stackoverflow question:
         * https://stackoverflow.com/questions/56854421/unexpected-bytes-used-in-chrome-storage
         */
        return this.getByteSize(data) < this.MAX_BYTES;
    }

    private getByteSize(data: T): number {
        // Avoid TextEncoder usage for compatibility reasons (not supported in chrome 32-37)
        return new Blob([
            JSON.stringify(data)
        ]).size;
    }

    private changeListener(changes: any, namespace: string): void {
        if (namespace !== this.type) {
            // Changes in wrong storage type
            return;
        }

        if (!(this.key in changes)) {
            // Changes in wrong key
            return;
        }

        this._onChange.dispatch(changes[ this.key ].newValue);
    }
}

export class PeriodicallyFlushedBrowserExtensionStorage<T> extends BrowserExtensionStorage<T> {
    private readonly timeout: number;
    private unflushed: T | null = null;

    constructor(type: BrowserExtensionStorageType, key: string, intervalSeconds: number) {
        super(type, key);

        this.timeout = window.setInterval(this.flush, intervalSeconds * 1000);
    }

    public save(data: T): Promise<void> {
        this.unflushed = data;

        return Promise.resolve();
    }

    public async clear(): Promise<void> {
        this.unflushed = null;

        await super.clear();
    }

    public dispose(): void {
        super.dispose();

        clearInterval(this.timeout);

        this.unflushed = null;
    }

    @bind
    public async flush(): Promise<void> {
        if (this.unflushed === null) {
            return;
        }

        await super.save(this.unflushed);
    }
}
