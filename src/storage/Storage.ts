import { type Subscribable } from "@/event/Event";

export interface Storage<T> {
    readonly onChange: Subscribable<T | null>;

    save(data: T | null): Promise<void>;
    load(): Promise<T | null>;
    clear(): Promise<void>;
    dispose(): void;
}
