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

        const data: Record<string, any> = await this.storageArea.get(this.key);
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
    }

    protected get storageArea(): StorageArea {
        return this.browser.storage[ this.type ];
    }

    @bind
    private changeListener(changes: Changes, storageType: StorageType): void {
        if (this.type !== storageType) {
            logger.debug("Underlying storage changed, except in wrong storage type",
                { thisType: this.type, changedType: storageType });

            return;
        }

        if (!(this.key in changes)) {
            logger.debug("Underlying storage changed, except in wrong key",
                { key: this.key, changes: Object.keys(changes).join(", ") });

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
