import bind from "bind-decorator";
import { LogEvent, Sink } from "logger/Sink";

/**
 * Sink that has to be manually flushed to actually process emitted log events.
 */
export class FlushedSink implements Sink {
    private readonly unflushed: LogEvent[] = [];

    public constructor(
        private readonly delegate: Sink
    ) {}

    public emit(logEvent: LogEvent): void {
        this.unflushed.push(logEvent);
    }

    public dispose(): void {
        this.unflushed.splice(0, this.unflushed.length);
    }

    @bind
    public flush(): void {
        while (this.unflushed.length > 0) {
            const logEvent = this.unflushed.pop();

            if (!logEvent) {
                continue;
            }

            this.delegate.emit(logEvent);
        }
    }
}

/**
 * FlushedSink that automatically flushes iteself periodically.
 */
export class PeriodicallyFlushedSink extends FlushedSink {
    private readonly intervalId: number;

    public constructor(intervalSeconds: number, delegate: Sink) {
        super(delegate);

        this.intervalId = window.setInterval(this.flush, intervalSeconds * 1000);
    }

    public dispose(): void {
        super.dispose();

        clearInterval(this.intervalId);
    }
}
