import { currentTimestampSeconds } from "util/Time";
import { Loggable, Logger, AbstractLogger, LogLevel } from "logger/Logger";
import { Logging } from "logger/Logging";

/**
 * Logger that outputs messages formatted as JSON objects.
 *
 * Example output:
 *   {
 *     "time": "2019-07-01T21:55:00.342Z",
 *     "message": "wawawa",
 *     "level": "4",
 *     "context": "MyClass"
 *   }
 */
export class JsonLogger extends AbstractLogger {
    private readonly context: Loggable[] = [];

    private constructor() {
        super();
    }

    public static create(): JsonLogger {
        return new JsonLogger();
    }

    public withContext(...args: Loggable[]): Logger {
        const logger = new JsonLogger();
        logger.context.push(...this.context, ...args);

        return logger;
    }

    public log(logLevel: LogLevel, message: string, ...args: Loggable[]): void {
        if (logLevel < Logging.getLogLevel()) {
            return;
        }

        let level: string;

        switch (logLevel) {
            case LogLevel.DEBUG:
                level = "DEBUG";
                break;
            case LogLevel.INFO:
                level = "INFO";
                break;
            case LogLevel.WARN:
                level = "WARN";
                break;
            case LogLevel.ERROR:
                level = "ERROR";
                break;
            default:
                throw `Unknown log level '${ logLevel }'`;
        }

        const time: number = currentTimestampSeconds();
        const context: Loggable = {
            time: new Date(time * 1000).toISOString(),
            message,
            level,
            ...this.getContext(this.context),
            ...this.getContext(args)
        };
        const output: string = JSON.stringify(context, null, 2);

        Logging.getSink().emit({
            level: logLevel,
            message: output,
            time: time
        });
    }
}
