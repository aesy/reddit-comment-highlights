import { LogEvent, Sink } from "logger/Sink";

/**
 * Combines multiple sinks into one.
 *
 * Sinks will be called in sequence on every log event, in the given order.
 *
 * This class will treat the given sinks as it's own and handle their lifetimes.
 */
export class CompoundSink implements Sink {
    public constructor(
        private readonly sinks: Sink[]
    ) {}

    public emit(logEvent: LogEvent): void {
        for (const sink of this.sinks) {
            sink.emit(logEvent);
        }
    }

    public dispose(): void {
        for (const sink of this.sinks) {
            sink.dispose();
        }

        this.sinks.splice(0, this.sinks.length);
    }
}
