import { Storage } from "storage/Storage";
import { LogEvent, Sink } from "logger/Sink";

export class StorageSink implements Sink {
    public constructor(
        private readonly storage: Storage<LogEvent[]>
    ) {}

    public dispose(): void {
        this.storage.dispose();
    }

    public async emit(logEvent: LogEvent): Promise<void> {
        let logs = await this.storage.load();

        if (!logs) {
            logs = [];
        }

        logs.push(logEvent);

        await this.storage.save(logs);
    }
}
