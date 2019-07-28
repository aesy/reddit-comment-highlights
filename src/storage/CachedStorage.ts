import bind from "bind-decorator";
import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { Storage } from "storage/Storage";

export class CachedStorage<T> implements Storage<T> {
    private readonly _onChange = new SyncEvent<T | null>();
    private readonly init: Promise<void>;
    private cache: Readonly<T | null> = null;

    public constructor(
        private readonly delegate: Storage<T>
    ) {
        // Listen for changes in storage and update internal cache
        delegate.onChange.subscribe(this.onStorageChange);

        // Sync internal cache with storage
        this.init = delegate.load()
            .then((data: T | null) => {
                this.cache = data;
            });
    }

    public get onChange(): Subscribable<T | null> {
        return this._onChange;
    }

    public async save(data: T | null): Promise<void> {
        await this.init;

        this.cache = data;

        return this.delegate.save(data);
    }

    public async load(): Promise<T | null> {
        await this.init;

        return this.cache;
    }

    public clear(): Promise<void> {
        return this.delegate.clear();
    }

    public dispose(): void {
        this._onChange.dispose();
        this.delegate.dispose();
    }

    @bind
    private onStorageChange(data: T | null): void {
        this.cache = data;

        this._onChange.dispatch(this.cache);
    }
}
