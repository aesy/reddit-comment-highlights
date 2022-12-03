export type EventListener<T> = (data: T) => void;

export interface Triggerable<T> {
    dispatch(data: T): void;
    dispose(): void;
}

export interface Subscribable<T> {
    subscribe(listener: EventListener<T>): void;
    unsubscribe(listener: EventListener<T>): void;
    once(listener: EventListener<T>): void;
    listener(): MethodDecorator;
}

export class Event<T> implements Subscribable<T>, Triggerable<T> {
    /*
     * Using a map rather than an array because the given listener may not be the
     * function we actually register (such as in the case of one-off listeners).
     */
    private readonly listeners: Map<EventListener<T>, EventListener<T>> = new Map();

    public dispatch(data: T): void {
        this.listeners.forEach(listener => {
            listener(data);
        });
    }

    public dispose(): void {
        this.listeners.clear();
    }

    public subscribe(listener: EventListener<T>): void {
        this.listeners.set(listener, listener);
    }

    public unsubscribe(listener: EventListener<T>): void {
        this.listeners.delete(listener);
    }

    public once(listener: EventListener<T>): void {
        this.listeners.set(listener, data => {
            listener(data);
            this.unsubscribe(listener);
        });
    }

    public listener(): MethodDecorator {
        return (target, propertyKey, descriptor) => {
            const listener: unknown = descriptor.value;

            this.subscribe(listener as EventListener<T>);

            return descriptor;
        };
    }
}
