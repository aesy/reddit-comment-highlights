import bind from "bind-decorator";
import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { Storage } from "storage/Storage";
import { ExtensionOptions, Options } from "options/ExtensionOptions";
import { Logging } from "logger/Logging";

const logger = Logging.getLogger("DefaultExtensionOptions");

/**
 * Storage based extension options with defaults.
 *
 * This class will treat the given storage as it's own and handle its' lifetime.
 */
export class DefaultExtensionOptions implements ExtensionOptions {
    private readonly _onChange = new SyncEvent<void>();

    public constructor(
        private readonly storage: Storage<Partial<Options>>,
        private readonly defaults: Readonly<Options>
    ) {
        storage.onChange.subscribe(this.onStorageChange);
    }

    public get onChange(): Subscribable<void> {
        return this._onChange;
    }

    public async get(): Promise<Options> {
        logger.debug("Reading ExtensionOptions");

        const data = await this.storage.load();

        return Object.assign({}, this.defaults, data);
    }

    public async set(options: Partial<Options>): Promise<void> {
        logger.debug("Saving ExtensionOptions");

        const oldData = await this.storage.load();
        const newData = Object.assign({}, oldData, options);
        const obj = newData as { [ key: string ]: any };

        for (const key in obj) {
            if (obj[ key ] === undefined) {
                delete obj[ key ];
            }
        }

        await this.storage.save(newData);
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing ExtensionOptions");

        await this.storage.clear();
    }

    public dispose(): void {
        logger.debug("Disposing ExtensionOptions");

        this._onChange.dispose();
        this.storage.dispose();
    }

    @bind
    private onStorageChange(): void {
        logger.debug("ExtensionOptions underlying storage changed");

        this._onChange.dispatch();
    }
}
