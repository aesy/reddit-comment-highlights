import { currentTimestampSeconds } from "@/util/Time";
import {
    AbstractLogger,
    type Loggable,
    type Logger,
    LogLevel,
} from "@/logger/Logger";
import { Logging } from "@/logger/Logging";

/**
 * Logger that outputs messages formatted in key value pairs.
 *
 * Example output:
 *   time="2019-07-01T21:55:00.342Z" message=wawawa level=4 context=MyClass
 */
export class KeyValueLogger extends AbstractLogger {
    private static readonly ESCAPE_CHARS: string[] = [
        " ",
        "-",
        "'",
        '"',
        "\n",
        "\t",
    ];
    private static readonly ESCAPE_REPLACEMENTS: Record<string, string> = {
        '"': '\\"',
        "\n": "\\n",
        "\t": "\\t",
    };
    private readonly context: Loggable[] = [];

    private constructor() {
        super();
    }

    public static create(): KeyValueLogger {
        return new KeyValueLogger();
    }

    private static shouldEscape(input: string): boolean {
        for (const char of KeyValueLogger.ESCAPE_CHARS) {
            if (input.indexOf(char) > -1) {
                return true;
            }
        }

        return false;
    }

    private static doEscape(input: string): string {
        for (const [char, replacement] of Object.entries(
            KeyValueLogger.ESCAPE_REPLACEMENTS,
        )) {
            input.replace(char, replacement);
        }

        return `"${input}"`;
    }

    public withContext(...args: Loggable[]): Logger {
        const logger = new KeyValueLogger();
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
                throw `Unknown log level '${logLevel}'`;
        }

        const time: number = currentTimestampSeconds();
        const context: Loggable = {
            time: new Date(time * 1000).toISOString(),
            message,
            level,
            ...this.getContext(this.context),
            ...this.getContext(args),
        };
        const groups: string[] = [];

        for (let [key, value] of Object.entries(context)) {
            if (KeyValueLogger.shouldEscape(key)) {
                key = KeyValueLogger.doEscape(key);
            }

            if (KeyValueLogger.shouldEscape(value)) {
                value = KeyValueLogger.doEscape(value);
            }

            groups.push(`${key}=${value}`);
        }

        const output: string = groups.join(" ");

        Logging.getSink().emit({
            level: logLevel,
            message: output,
            time: time,
        });
    }
}
