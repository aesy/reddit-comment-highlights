import { LogLevel } from "@/logger/Logger";
import { type LogEvent, type Sink } from "@/logger/Sink";

/**
 * Sink that logs directly to the console.
 */
export class ConsoleSink implements Sink {
    public emit(logEvent: LogEvent): void {
        let log: (message: string) => void;

        switch (logEvent.level) {
            case LogLevel.DEBUG:
                log = console.debug;
                break;
            case LogLevel.INFO:
                log = console.info;
                break;
            case LogLevel.WARN:
                log = console.warn;
                break;
            case LogLevel.ERROR:
                log = console.error;
                break;
            default:
                log = () => {
                    /* Do nothing */
                };
        }

        log(logEvent.message);
    }

    public dispose(): void {
        // Do nothing
    }
}
