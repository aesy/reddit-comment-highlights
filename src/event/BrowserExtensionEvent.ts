import bind from "bind-decorator";
import { Logging } from "logger/Logging";
import browser from "webextension-polyfill";
import { Event } from "event/Event";

const logger = Logging.getLogger("BrowserExtensionEvent");

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
        private readonly eventType: string
    ) {
        super();

        if (browser.runtime) {
            browser.runtime.onMessage.addListener(this.handleMessage);
        }
    }

    public dispatch(data: T): void {
        const payload: EventPayload<T> = {
            method: this.eventType,
            message: data
        };

        logger.debug("Dispatching event", { eventType: this.eventType });

        if (browser.runtime) {
            browser.runtime.sendMessage(payload)
                .then(() => {
                    logger.debug("Successfully sent message", { eventType: this.eventType });
                })
                .catch(error => {
                    logger.warn("Failed to send message", {
                        eventType: this.eventType,
                        error: JSON.stringify(error)
                    });
                });
        }

        if (browser.tabs) {
            browser.tabs.query({})
                .then(tabs => {
                    logger.debug("Successfully queried tabs", {
                        eventType: this.eventType,
                        count: String(tabs.length)
                    });

                    for (const tab of tabs) {
                        browser.tabs.sendMessage(tab.id!, payload)
                            .then(() => {
                                logger.debug("Successfully sent message to tab", {
                                    eventType: this.eventType,
                                    tab: String(tab.id)
                                });
                            })
                            .catch(error => {
                                logger.warn("Failed to send message to tab", {
                                    eventType: this.eventType,
                                    tab: String(tab.id),
                                    error: JSON.stringify(error)
                                });
                            });
                    }
                })
                .catch(error => {
                    logger.debug("Failed to query tabs", {
                        eventType: this.eventType,
                        error: JSON.stringify(error)
                    });
                });
        }

        super.dispatch(data);
    }

    public async dispose(): Promise<void> {
        super.dispose();

        if (browser.runtime) {
            await browser.runtime.onMessage.removeListener(this.handleMessage);
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

        logger.debug("Received message", { eventType: this.eventType, method });

        super.dispatch(payload.message);
    }
}
