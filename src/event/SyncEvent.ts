import { EventListener, Subscribable, Triggerable } from "event/Event";

export class SyncEvent<T> implements Subscribable<T>, Triggerable<T> {
    /*
     * Using a map rather than an array because the given listener may not be the
     * function we actually register (such as in the case of one-off listeners).
     */
    private readonly listeners: Map<EventListener<T>, EventListener<T>> = new Map();

    public dispatch(data: T): this {
        this.listeners.forEach(listener => {
            listener(data);
        });

        return this;
    }

    public dispose(): void {
        this.listeners.clear();
    }

    public subscribe(listener: EventListener<T>): this {
        this.listeners.set(listener, listener);

        return this;
    }

    public unsubscribe(listener: EventListener<T>): this {
        this.listeners.delete(listener);

        return this;
    }

    public once(listener: EventListener<T>): this {
        this.listeners.set(listener, data => {
            listener(data);
            this.unsubscribe(listener);
        });

        return this;
    }

    public listener(): MethodDecorator {
        return (target, propertyKey, descriptor) => {
            const listener: unknown = descriptor.value;

            this.subscribe(listener as EventListener<T>);

            return descriptor;
        };
    }
}
