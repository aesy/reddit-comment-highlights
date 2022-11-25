import { SyncEvent } from "event/SyncEvent";

// TODO AsyncEvent should not inherit from SyncEvent...
export class AsyncEvent<T> extends SyncEvent<T> {
    private timeout: NodeJS.Timeout | null = null;

    public dispatch(data: T): this {
        this.timeout = setTimeout((): void => {
            this.timeout = null;

            super.dispatch(data);
        }, 0);

        return this;
    }

    public dispose(): void {
        super.dispose();

        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }
}
