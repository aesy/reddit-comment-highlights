import { Subscribable, Event } from "event/Event";

export interface Storage<T> {
    readonly onChange: Subscribable<T>;

    save(data: T): Promise<void>;
    load(): Promise<T | null>;
    clear(): Promise<void>;
    dispose(): void;
}

export class InMemoryStorage<T> implements Storage<T> {
    private readonly _onChange: Event<T> = new Event();
    private data: T | null = null;

    public get onChange(): Subscribable<T> {
        return this._onChange;
    }

    public async save(data: T): Promise<void> {
        this.data = data;
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
