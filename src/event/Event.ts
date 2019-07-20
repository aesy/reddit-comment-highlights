import bind from "bind-decorator";

export type EventListener<T> = (data: T) => void;

export interface Triggerable<T> {
    dispatch(data: T): this;
    dispose(): void;
}

export interface Subscribable<T> {
    subscribe(listener: EventListener<T>): this;
    unsubscribe(listener: EventListener<T>): this;
    once(listener: EventListener<T>): this;
    listener(): MethodDecorator;
}

export class Event<T> implements Subscribable<T>, Triggerable<T> {
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

    public subscribe(listener: (data: T) => void): this {
        this.listeners.set(listener, listener);

        return this;
    }

    public unsubscribe(listener: (data: T) => void): this {
        this.listeners.delete(listener);

        return this;
    }

    public once(listener: (data: T) => void): this {
        this.listeners.set(listener, data => {
            listener(data);
            this.unsubscribe(listener);
        });

        return this;
    }

    public listener(): MethodDecorator {
        return (target, propertyKey, descriptor) => {
            const listener: unknown = descriptor.value;

            this.subscribe(listener as (data: T) => void);

            return descriptor;
        };
    }
}

export class AsyncEvent<T> extends Event<T> {
    private timeout: number | null = null;

    public dispatch(data: T): this {
        this.timeout = window.setTimeout((): void => {
            this.timeout = null;

            super.dispatch(data);
        }, 0);

        return this;
    }

    public dispose(): void {
        super.dispose();

        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }
}

export class FlushedEvent<T> implements Subscribable<T>, Triggerable<T> {
    private readonly unflushed: T[] = [];

    public constructor(
        private readonly delegate: Event<T>
    ) {}

    public dispatch(data: T): this {
        this.unflushed.push(data);

        return this;
    }

    public dispose(): void {
        this.unflushed.splice(0, this.unflushed.length);
    }

    public subscribe(listener: (data: T) => void): this {
        this.delegate.subscribe(listener);

        return this;
    }

    public unsubscribe(listener: (data: T) => void): this {
        this.delegate.unsubscribe(listener);

        return this;
    }

    public once(listener: (data: T) => void): this {
        this.delegate.once(listener);

        return this;
    }

    public listener(): MethodDecorator {
        return this.delegate.listener();
    }

    @bind
    public flush(): this {
        while (this.unflushed.length > 0) {
            const data = this.unflushed.pop();

            if (!data) {
                continue;
            }

            this.delegate.dispatch(data);
        }

        return this;
    }
}

export class PeriodicallyFlushedEvent<T> extends FlushedEvent<T> {
    private readonly intervalId: number;

    public constructor(intervalSeconds: number, delegate: Event<T>) {
        super(delegate);

        this.intervalId = window.setInterval(this.flush, intervalSeconds * 1000);
    }

    public dispose(): void {
        super.dispose();

        clearInterval(this.intervalId);
    }
}
