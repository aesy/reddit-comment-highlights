import bind from "bind-decorator";
import { Event, Subscribable } from "event/Event";
import { Storage } from "storage/Storage";
import { Logging } from "logger/Logging";

const logger = Logging.getLogger("CachedStorage");

export class CachedStorage<T> implements Storage<T> {
    private readonly _onChange = new Event<T | null>();
    private cache: Readonly<T | null> = null;
    private initialized = false;

    public constructor(
        private readonly name: string,
        private readonly delegate: Storage<T>
    ) {
        // Listen for changes in storage and update internal cache
        delegate.onChange.subscribe(this.onStorageChange);
    }

    public get onChange(): Subscribable<T | null> {
        return this._onChange;
    }

    public async save(data: T | null): Promise<void> {
        logger.debug("Caching data", { name: this.name });

        this.cache = data;

        return this.delegate.save(data);
    }

    public async load(): Promise<T | null> {
        logger.debug("Reading data from cache", { name: this.name });

        if (!this.initialized) {
            logger.debug("Initializing cache", { name: this.name });
            this.initialized = true;
            this.cache = await this.delegate.load();
        }

        return this.cache;
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing storage with cache", { name: this.name });

        this.cache = null;
        this.initialized = false;

        await this.delegate.clear();
    }

    public dispose(): void {
        logger.debug("Disposing storage", { name: this.name });

        this._onChange.dispose();
        this.delegate.dispose();
    }

    @bind
    private onStorageChange(data: T | null): void {
        logger.debug("Underlying storage changed", { name: this.name });
        logger.debug("Caching data", { name: this.name });

        this.cache = data;
        this.initialized = true;

        this._onChange.dispatch(this.cache);
    }
}
