import { LogLevel } from "logger/Logger";

export interface LogEvent {
    message: string;
    level: LogLevel;
    time: number;
}

export interface Sink {
    emit(logEvent: LogEvent): void;
    dispose(): void;
}
