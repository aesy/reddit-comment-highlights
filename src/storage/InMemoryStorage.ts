import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { Storage } from "storage/Storage";
import { Logging } from "logger/Logging";

const logger = Logging.getLogger("InMemoryStorage");

export class InMemoryStorage<T> implements Storage<T> {
    private readonly _onChange = new SyncEvent<T>();
    private data: T | null = null;

    public get onChange(): Subscribable<T> {
        return this._onChange;
    }

    public async save(data: T): Promise<void> {
        logger.debug("Saving data");

        this.data = data;

        this._onChange.dispatch(data);
    }

    public async load(): Promise<T | null> {
        logger.debug("Reading data");

        return this.data;
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing data");

        this.data = null;
    }

    public dispose(): void {
        logger.debug("Disposing storage");

        this.data = null;
        this._onChange.dispose();
    }
}
