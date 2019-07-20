import { Subscribable } from "event/Event";

export interface Storage<T> {
    readonly onChange: Subscribable<T>;

    save(data: T): Promise<void>;
    load(): Promise<T | null>;
    clear(): Promise<void>;
    dispose(): void;
}
