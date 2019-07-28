import bind from "bind-decorator";
import { AsyncEvent } from "event/AsyncEvent";
import { Subscribable } from "event/Event";
import { Storage } from "storage/Storage";
import { Logger } from "logger/Logger";
import { Logging } from "logger/Logging";

declare const chrome: any | undefined;
declare const browser: any | undefined;
declare const window: any | undefined;

export enum BrowserExtensionStorageType {
    LOCAL = "local",
    SYNC = "sync"
}

export class BrowserExtensionStorage<T> implements Storage<T> {
    protected readonly logger: Logger;
    private readonly _onChange = new AsyncEvent<T | null>();
    private readonly global: any;

    public constructor(
        private readonly type: BrowserExtensionStorageType,
        private readonly key: string
    ) {
        this.logger = Logging.getLogger("BrowserExtensionStorage")
            .withContext({ type, key });

        if (typeof chrome !== typeof undefined) {
            this.logger.debug("Detected chrome");

            this.global = chrome;
        } else if (typeof browser !== typeof undefined) {
            this.logger.debug("Detected browser");

            this.global = browser;
        } else if (typeof window !== typeof undefined) {
            this.logger.debug("Detected window");

            this.global = window;
        } else {
            this.logger.error("No global object detected");

            throw "No global object detected";
        }

        this.storage.onChanged.addListener(this.changeListener);
    }

    public get onChange(): Subscribable<T | null> {
        return this._onChange;
    }

    public async save(data: T | null): Promise<void> {
        this.logger.debug("Saving data");

        if (!this.canSave(data)) {
            throw `Failed to save data. Reason: max byte quota exceeded (${ this.MAX_BYTES }b)`;
        }

        await new Promise<void>((resolve, reject) => {
            this.storage.set({ [ this.key ]: data }, () => {
                const error = this.global.runtime.lastError;

                if (error) {
                    this.logger.error("Failed to save data", { error: JSON.stringify(error) });

                    return reject(error);
                }

                return resolve();
            });
        });

        this.logger.debug("Successfully saved data");
    }

    public async load(): Promise<T | null> {
        this.logger.debug("Loading data");

        const result = await new Promise<T>((resolve, reject) => {
            this.storage.get(this.key, (data: { [ key: string ]: T }) => {
                const error = this.global.runtime.lastError;

                if (error) {
                    this.logger.error("Failed to load data", { error: JSON.stringify(error) });

                    return reject(error);
                }

                return resolve(data[ this.key ]);
            });
        });

        this.logger.debug("Successfully loaded data");

        return result;
    }

    public async clear(): Promise<void> {
        this.logger.debug("Clearing data");

        await new Promise<void>((resolve, reject) => {
            this.storage.set({ [ this.key ]: undefined }, () => {
                const error = this.global.runtime.lastError;

                if (error) {
                    this.logger.error("Failed to clear data", { error: JSON.stringify(error) });

                    return reject(error);
                }

                return resolve();
            });
        });

        this.logger.debug("Successfully cleared data");
    }

    public dispose() {
        this._onChange.dispose();
        this.storage.onChanged.removeListener(this.changeListener);
        this.logger.dispose();
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

    protected canSave(data: T | null): boolean {
        /*
         * We can't completely rely on this comparison. It doesn't always match up with the
         * browser implementation. See the following stackoverflow question:
         * https://stackoverflow.com/questions/56854421/unexpected-bytes-used-in-chrome-storage
         */
        return this.getByteSize(data) < this.MAX_BYTES;
    }

    private getByteSize(data: T | null): number {
        // Avoid TextEncoder usage for compatibility reasons (not supported in chrome 32-37)
        return new Blob([
            JSON.stringify(data)
        ]).size;
    }

    @bind
    private changeListener(changes: any): void {
        if (!(this.key in changes)) {
            // Changes in wrong key
            this.logger.debug("Underlying storage changed, except in wrong key",
                { changes: Object.keys(changes).join(", ") });

            return;
        }

        this.logger.debug("Underlying storage changed");

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

    public async save(data: T | null): Promise<void> {
        this.logger.debug("Data saved, waiting to be flushed");

        this.unflushed = data;
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

        this.logger.debug("Flusing storage");

        await super.save(this.unflushed);

        this.unflushed = null;
    }
}
