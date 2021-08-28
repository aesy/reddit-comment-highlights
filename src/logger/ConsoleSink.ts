import { LogLevel } from "logger/Logger";
import { LogEvent, Sink } from "logger/Sink";

/**
 * Sink that logs directly to the console.
 */
export class ConsoleSink implements Sink {
    public emit(logEvent: LogEvent): void {
        let log: (message: string) => void;

        switch (logEvent.level) {
            /*
             * In Chromium 58+ `console.debug` only appears when level "Verbose" is selected.
             * Use `console.info` instead to avoid having users meddle with browser settings.
             */
            case LogLevel.DEBUG:
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
                log = () => { /* Do nothing */ };
        }

        log(logEvent.message);
    }

    public dispose(): void {
        // Do nothing
    }
}
