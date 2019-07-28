import bind from "bind-decorator";
import { Event } from "event/Event";

export class FlushedEvent<T> implements Event<T> {
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
