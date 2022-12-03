import bind from "bind-decorator";
import browser, { Storage as BrowserStorage } from "webextension-polyfill";
import { Event, Subscribable } from "event/Event";
import { Storage } from "storage/Storage";
import { Logging } from "logger/Logging";

const logger = Logging.getLogger("BrowserExtensionStorage");

type Changes = Record<string, BrowserStorage.StorageChange>;

const onStorageChanged: Event<{ changes: Changes, storageType: string }> = new Event();

browser.storage.onChanged.addListener((changes, storageType) => {
    onStorageChanged.dispatch({ changes, storageType });
});

export class BrowserExtensionStorage<T> implements Storage<T> {
    private readonly _onChange = new Event<T | null>();

    public constructor(
        protected readonly name: string,
        private readonly type: "sync" | "local",
        private readonly key: string
    ) {
        onStorageChanged.subscribe(this.changeListener);
    }

    public get onChange(): Subscribable<T | null> {
        return this._onChange;
    }

    public async save(data: T | null): Promise<void> {
        logger.debug("Saving data", { name: this.name });

        await this.storageArea.set({ [ this.key ]: data });

        logger.debug("Successfully saved data", { name: this.name });
    }

    public async load(): Promise<T | null> {
        logger.debug("Loading data", { name: this.name });

        const data = await this.storageArea.get(this.key);

        logger.debug("Successfully loaded data", { name: this.name });

        return data[this.key] ?? null;
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing data", { name: this.name });

        await this.storageArea.set({ [ this.key ]: null });

        logger.debug("Successfully cleared data", { name: this.name });
    }

    public dispose(): void {
        this._onChange.dispose();
        onStorageChanged.unsubscribe(this.changeListener);
    }

    protected get storageArea(): BrowserStorage.StorageArea {
        switch (this.type) {
            case "sync":
                return browser.storage.sync;
            case "local":
                return browser.storage.local;
        }
    }

    @bind
    private changeListener({ changes, storageType }: { changes: Changes, storageType: string }): void {
        if (this.type !== storageType) {
            return;
        }

        if (!(this.key in changes)) {
            return;
        }

        logger.debug("Underlying storage changed", { name: this.name });

        this._onChange.dispatch(changes[ this.key ].newValue);
    }
}
