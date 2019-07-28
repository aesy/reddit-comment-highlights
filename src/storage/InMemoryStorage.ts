import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { Storage } from "storage/Storage";

export class InMemoryStorage<T> implements Storage<T> {
    private readonly _onChange = new SyncEvent<T>();
    private data: T | null = null;

    public get onChange(): Subscribable<T> {
        return this._onChange;
    }

    public async save(data: T): Promise<void> {
        this.data = data;

        this._onChange.dispatch(data);
    }

    public async load(): Promise<T | null> {
        return this.data;
    }

    public async clear(): Promise<void> {
        this.data = null;
    }

    public dispose(): void {
        // Do nothing
    }
}
