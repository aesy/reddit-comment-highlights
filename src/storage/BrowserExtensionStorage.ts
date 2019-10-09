import bind from "bind-decorator";
import { AsyncEvent } from "event/AsyncEvent";
import { Subscribable } from "event/Event";
import { Storage } from "storage/Storage";
import { Logging } from "logger/Logging";
import { Browser, StorageArea, StorageType, Changes } from "typings/Browser";

const logger = Logging.getLogger("BrowserExtensionStorage");

export class BrowserExtensionStorage<T> implements Storage<T> {
    private readonly _onChange = new AsyncEvent<T | null>();

    public constructor(
        private readonly browser: Browser,
        private readonly type: StorageType,
        private readonly key: string
    ) {
        this.browser.storage.onChanged.addListener(this.changeListener);
    }

    public get onChange(): Subscribable<T | null> {
        return this._onChange;
    }

    public async save(data: T | null): Promise<void> {
        logger.debug("Saving data");

        if (!this.canSave(data)) {
            throw `Failed to save data. Reason: max byte quota exceeded (${ this.MAX_BYTES }b)`;
        }

        await this.storageArea.set({ [ this.key ]: data });

        const error = this.browser.runtime!.lastError;

        if (error) {
            logger.error("Failed to save data", { error: JSON.stringify(error) });

            throw error;
        }

        logger.debug("Successfully saved data");
    }

    public async load(): Promise<T | null> {
        logger.debug("Loading data");

        const data: { [ keys: string ]: any } = await this.storageArea.get(this.key);
        const error = this.browser.runtime!.lastError;

        if (error) {
            logger.error("Failed to load data", { error: JSON.stringify(error) });

            throw error;
        }

        const result = data[ this.key ];

        logger.debug("Successfully loaded data");

        return result;
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing data");

        await this.storageArea.set({ [ this.key ]: null });

        const error = this.browser.runtime!.lastError;

        if (error) {
            logger.error("Failed to clear data", { error: JSON.stringify(error) });

            throw error;
        }

        logger.debug("Successfully cleared data");
    }

    public dispose(): void {
        this._onChange.dispose();
        this.browser.storage.onChanged.removeListener(this.changeListener);
        logger.dispose();
    }

    protected get storageArea(): StorageArea {
        return this.browser.storage[ this.type ];
    }

    /**
     * Returns the max byte size that can be saved
     */
    private get MAX_BYTES(): number {
        return -1;

        // switch (this.type) {
        //     case BrowserExtensionStorageType.LOCAL:
        //         /*
        //          * This is true for the whole storage, not this specific key.
        //          * Actually, it may not even be true for the whole storage when
        //          * granted the unlimitedStorage permission.
        //          */
        //         return this.storage.QUOTA_BYTES;
        //     case BrowserExtensionStorageType.SYNC:
        //         /*
        //          * QUOTA_BYTES_PER_ITEM is measured by the JSON stringification of its
        //          * value plus its' key length.
        //          */
        //         return this.storage.QUOTA_BYTES_PER_ITEM
        //                // Subtract key length because it's constant
        //                - this.key.length;
        // }
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
    private changeListener(changes: Changes, storageType: StorageType): void {
        // TODO check storage type ?

        if (!(this.key in changes)) {
            // Changes in wrong key
            logger.debug("Underlying storage changed, except in wrong key",
                { changes: Object.keys(changes).join(", ") });

            return;
        }

        logger.debug("Underlying storage changed");

        this._onChange.dispatch(changes[ this.key ].newValue);
    }
}

export class PeriodicallyFlushedBrowserExtensionStorage<T> extends BrowserExtensionStorage<T> {
    private readonly timeout: number;
    private unflushed: T | null = null;

    public constructor(browser: Browser, type: StorageType, key: string, intervalSeconds: number) {
        super(browser, type, key);

        this.timeout = window.setInterval(this.flush, intervalSeconds * 1000);
    }

    public async save(data: T | null): Promise<void> {
        logger.debug("Data saved, waiting to be flushed");

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

        logger.debug("Flusing storage");

        await super.save(this.unflushed);

        this.unflushed = null;
    }
}
