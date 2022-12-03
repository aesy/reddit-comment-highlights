import bind from "bind-decorator";
import { Browser } from "webextension-polyfill";
import { Event } from "event/Event";

interface EventPayload<T> {
    method: string;
    message: T;
}

/**
 * Asynchronous event that works across scripts by communicating through browser message
 * listeners.
 */
export class BrowserExtensionEvent<T> extends Event<T> {
    public constructor(
        private readonly browser: Browser,
        private readonly eventType: string
    ) {
        super();

        if (this.browser.runtime) {
            this.browser.runtime.onMessage.addListener(this.handleMessage);
        }
    }

    public async dispatch(data: T): Promise<void> {
        const payload: EventPayload<T> = {
            method: this.eventType,
            message: data
        };

        if (this.browser.runtime) {
            await this.browser.runtime.sendMessage(payload);
        }

        if (this.browser.tabs) {
            await this.browser.tabs.query({})
                .then(tabs => Promise.all(
                    tabs.map(tab => this.browser.tabs.sendMessage(tab.id!, payload)))
                );
        }

        super.dispatch(data);
    }

    public async dispose(): Promise<void> {
        super.dispose();

        if (this.browser.runtime) {
            await this.browser.runtime.onMessage.removeListener(this.handleMessage);
        }
    }

    @bind
    private handleMessage(obj: object | void): void {
        if (!obj) {
            return;
        }

        if (typeof obj !== "object") {
            return;
        }

        const payload = obj as EventPayload<T>;
        const method = payload.method;

        if (typeof method !== "string") {
            return;
        }

        if (method !== this.eventType) {
            return;
        }

        super.dispatch(payload.message);
    }
}
