import { ConsoleSink } from "@/logger/ConsoleSink";
import { type Loggable, type Logger, LogLevel } from "@/logger/Logger";
import { type Sink } from "@/logger/Sink";

export type LoggerFactory = () => Logger;

const NoopLogger: Logger = {
    debug(): void {
        /* Do nothing */
    },
    dispose(): void {
        /* Do nothing */
    },
    error(): void {
        /* Do nothing */
    },
    info(): void {
        /* Do nothing */
    },
    log(): void {
        /* Do nothing */
    },
    warn(): void {
        /* Do nothing */
    },
    withContext(): Logger {
        return this;
    },
};

let logLevel: LogLevel = LogLevel.INFO;
let logSink: Sink = new ConsoleSink();
let createLogger: LoggerFactory = () => NoopLogger;
let logger: Logger | null = null;
let isDirty: boolean;

function getLogger(): Logger {
    if (isDirty || logger === null) {
        if (logger) {
            logger.dispose();
        }

        logger = createLogger();
        isDirty = false;
    }

    return logger;
}

class ProxiedLogger implements Logger {
    private readonly context: Loggable[] = [];

    public constructor(context?: string) {
        if (context) {
            this.context.push({ context });
        }
    }

    public log(logLevel: LogLevel, message: string, ...args: Loggable[]): void {
        getLogger().log(logLevel, message, ...this.context, ...args);
    }

    public debug(message: string, ...args: Loggable[]): void {
        getLogger().debug(message, ...this.context, ...args);
    }

    public info(message: string, ...args: Loggable[]): void {
        getLogger().info(message, ...this.context, ...args);
    }

    public warn(message: string, ...args: Loggable[]): void {
        getLogger().warn(message, ...this.context, ...args);
    }

    public error(message: string, ...args: Loggable[]): void {
        getLogger().error(message, ...this.context, ...args);
    }

    public dispose(): void {
        // Do nothing
    }

    public withContext(...args: Loggable[]): Logger {
        const logger = new ProxiedLogger();
        logger.context.push(...this.context, ...args);

        return logger;
    }
}

/**
 * Global logger factory.
 */
export class Logging {
    private constructor() {
        // Intentionally left empty
    }

    public static setLoggerFactory(factory: LoggerFactory): void {
        createLogger = factory;
        isDirty = true;
    }

    public static getLogLevel(): LogLevel {
        return logLevel;
    }

    public static setLogLevel(level: LogLevel): void {
        logLevel = level;
    }

    public static getSink(): Sink {
        return logSink;
    }

    public static setSink(sink: Sink): void {
        logSink = sink;
    }

    /**
     * Creates a logger that will always use the settings set in this class, no matter what
     * functions are called in what order.
     */
    public static getLogger(context?: string): Logger {
        return new ProxiedLogger(context);
    }
}
