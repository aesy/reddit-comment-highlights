export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
}

export interface LogContext {
    getLogContext(): Loggable;
}

/**
 * Loggable may be used to give a log message additional context.
 */
export type Loggable = LogContext | Record<string, string>;

/**
 * Structured logger.
 */
export interface Logger {
    /**
     * Creates a new logger with additional context used by all subsequent log calls.
     */
    withContext(...args: Loggable[]): Logger;
    log(logLevel: LogLevel, message: string, ...args: Loggable[]): void;
    debug(message: string, ...args: Loggable[]): void;
    info(message: string, ...args: Loggable[]): void;
    warn(message: string, ...args: Loggable[]): void;
    error(message: string, ...args: Loggable[]): void;
    dispose(): void;
}

export abstract class AbstractLogger implements Logger {
    public abstract withContext(...args: Loggable[]): Logger;

    public abstract log(logLevel: LogLevel, message: string, ...args: Loggable[]): void;

    public debug(message: string, ...args: Loggable[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    public info(message: string, ...args: Loggable[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    public warn(message: string, ...args: Loggable[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    public error(message: string, ...args: Loggable[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }

    public dispose(): void {
        // Do nothing
    }

    /**
     * Recursively unwraps loggables into objects.
     */
    protected getContext(args: Loggable[]): Record<string, string> {
        let obj: Record<string, string> = {};

        for (const arg of args) {
            if ("getLogContext" in arg) {
                const loggable = (arg as LogContext).getLogContext();
                const context = this.getContext([ loggable ]);

                obj = { ...obj, ...context };
            } else {
                obj = { ...obj, ...arg };
            }
        }

        return obj;
    }
}
