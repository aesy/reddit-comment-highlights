import bind from "bind-decorator";
import { AsyncEvent, Subscribable } from "event/Event";

declare const chrome: any | undefined;
declare const browser: any | undefined;
declare const window: any | undefined;

// https://developer.chrome.com/extensions/tabs#type-Tab
type Tab = { id: string };

interface EventPayload<T> {
    method: string,
    message: T
}

/**
 * Asynchronous event that works across scripts by communicating through browser message
 * listeners.
 */
export class BrowserExtensionEvent<T> extends AsyncEvent<T> {
    private static readonly METHOD_PREFIX: string = "__BrowserExtensionEvent__";
    protected readonly global: any;

    public constructor(
        private readonly eventType: string
    ) {
        super();

        if (typeof chrome !== typeof undefined) {
            this.global = chrome;
        } else if (typeof browser !== typeof undefined) {
            this.global = browser;
        } else if (typeof window !== typeof undefined) {
            this.global = window;
        } else {
            this.global = {};
        }

        this.initialize();
    }

    public dispatch(data: T): this {
        const payload: EventPayload<T> = {
            method: `${ BrowserExtensionEvent.METHOD_PREFIX }${ this.eventType }`,
            message: data
        };

        if (this.global.runtime) {
            this.global.runtime.sendMessage(payload);
        }

        if (this.global.tabs) {
            this.global.tabs.query({ active: true }, (tabs: Tab[]) => {
                for (const tab of tabs) {
                    this.global.tabs.sendMessage(tab.id, payload);
                }
            });
        }

        super.dispatch(data);

        return this;
    }

    public dispose(): void {
        super.dispose();

        if (this.global.runtime) {
            this.global.runtime.onMessage.removeListener(this.handleMessage);
        }
    }

    protected initialize(): void {
        if (this.global.runtime && this.global.runtime.onMessage) {
            this.global.runtime.onMessage.addListener(this.handleMessage);
        }
    }

    @bind
    private handleMessage(payload: EventPayload<T>): void {
        if (typeof payload !== "object") {
            return;
        }

        const method = payload.method;

        if (typeof method !== "string") {
            return;
        }

        if (!method.startsWith(BrowserExtensionEvent.METHOD_PREFIX)) {
            // Message is not related to extension events
            return;
        }

        const eventType = method.substring(BrowserExtensionEvent.METHOD_PREFIX.length);

        if (eventType !== this.eventType) {
            return;
        }

        super.dispatch(payload.message);
    }
}

abstract class AbstractOnInstalledEvent<T> extends BrowserExtensionEvent<T> {
    protected constructor(
        private readonly reason: string
    ) {
        super(reason);
    }

    public dispose(): void {
        super.dispose();

        if (this.global.runtime && this.global.runtime.onInstalled) {
            this.global.runtime.onInstalled.removeListener(this.handleInstallEvent);
        }
    }

    protected initialize(): void {
        super.initialize();

        if (this.global.runtime && this.global.runtime.onInstalled) {
            this.global.runtime.onInstalled.addListener(this.handleInstallEvent);
        }
    }

    protected abstract getMessage(details: any): T;

    @bind
    private handleInstallEvent(details: any): void {
        if (this.reason !== details.reason) {
            return;
        }

        this.dispatch(this.getMessage(details));
    }
}

class OnInstalledEvent extends AbstractOnInstalledEvent<void> {
    constructor() {
        super("install");
    }

    protected getMessage(details: any): void {
        return undefined;
    }
}

class OnUpdatedEvent extends AbstractOnInstalledEvent<{ previousVersion: string }> {
    constructor() {
        super("update");
    }

    protected getMessage(details: any): { previousVersion: string } {
        return {
            previousVersion: details.previousVersion
        };
    }
}

export const onInstallEvent: Subscribable<void> = new OnInstalledEvent();

export const onUpdateEvent: Subscribable<{ previousVersion: string }> = new OnUpdatedEvent();
