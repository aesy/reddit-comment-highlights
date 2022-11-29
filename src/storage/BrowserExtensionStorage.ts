import bind from "bind-decorator";
import { Browser, Storage as BrowserStorage } from "webextension-polyfill";
import { AsyncEvent } from "event/AsyncEvent";
import { Subscribable } from "event/Event";
import { Storage } from "storage/Storage";
import { Logging } from "logger/Logging";

type Changes = Record<string, BrowserStorage.StorageChange>;

const logger = Logging.getLogger("BrowserExtensionStorage");

export class BrowserExtensionStorage<T> implements Storage<T> {
    private readonly _onChange = new AsyncEvent<T | null>();

    public constructor(
        protected readonly name: string,
        private readonly browser: Browser,
        private readonly type: "sync" | "local",
        private readonly key: string
    ) {
        this.browser.storage.onChanged.addListener(this.changeListener);
    }

    public get onChange(): Subscribable<T | null> {
        return this._onChange;
    }

    public async save(data: T | null): Promise<void> {
        logger.debug("Saving data", { name: this.name });

        await this.storageArea.set({ [ this.key ]: data });

        const error = this.browser.runtime.lastError;

        if (error) {
            logger.error("Failed to save data", { error: JSON.stringify(error), name: this.name });

            throw error;
        }

        logger.debug("Successfully saved data", { name: this.name });
    }

    public async load(): Promise<T | null> {
        logger.debug("Loading data", { name: this.name });

        const data: Record<string, T> = await this.storageArea.get(this.key);
        const error = this.browser.runtime.lastError;

        if (error) {
            logger.error("Failed to load data", { error: JSON.stringify(error), name: this.name });

            throw error;
        }

        const result = data[ this.key ] ?? null;

        logger.debug("Successfully loaded data", { name: this.name });

        return result;
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing data", { name: this.name });

        await this.storageArea.set({ [ this.key ]: null });

        const error = this.browser.runtime.lastError;

        if (error) {
            logger.error("Failed to clear data", { error: JSON.stringify(error), name: this.name });

            throw error;
        }

        logger.debug("Successfully cleared data", { name: this.name });
    }

    public dispose(): void {
        this._onChange.dispose();
        this.browser.storage.onChanged.removeListener(this.changeListener);
    }

    protected get storageArea(): BrowserStorage.StorageArea {
        switch (this.type) {
            case "sync":
                return this.browser.storage.sync;
            case "local":
                return this.browser.storage.local;
        }
    }

    @bind
    private changeListener(changes: Changes, storageType: string): void {
        if (this.type !== storageType) {
            logger.debug("Underlying storage changed, except in wrong storage type",
                { thisType: this.type, changedType: storageType, name: this.name });

            return;
        }

        if (!(this.key in changes)) {
            logger.debug("Underlying storage changed, except in wrong key",
                { key: this.key, changes: Object.keys(changes).join(", "), name: this.name });

            return;
        }

        logger.debug("Underlying storage changed", { name: this.name });

        this._onChange.dispatch(changes[ this.key ].newValue);
    }
}
