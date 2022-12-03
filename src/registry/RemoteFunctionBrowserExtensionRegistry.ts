import bind from "bind-decorator";
import { Logging } from "logger/Logging";
import browser from "webextension-polyfill";
import { FunctionRegistry } from "registry/FunctionRegistry";

const logger = Logging.getLogger("RemoteFunctionBrowserExtensionRegistry");

interface InvocationRequest<T> {
    method: string;
    arg: T;
}

type InvocationResponse<R> =
    {
        method: string;
        error: unknown
    } | {
        method: string;
        result: R
    };

export class RemoteFunctionBrowserExtensionRegistry implements FunctionRegistry {
    private readonly functions: Map<string, Function> = new Map();

    public constructor() {
        if (browser.runtime) {
            browser.runtime.onMessage.addListener(this.messageListener);
        }
    }

    public register<T, R>(key: string, action: (arg: T) => R): void {
        this.functions.set(key, action);
    }

    public unregister(key: string): void {
        this.functions.delete(key);
    }

    public async invoke<T, R>(key: string, arg?: T): Promise<R> {
        const func = this.functions.get(key);

        logger.debug("Invoking function", { method: key, local: String(Boolean(func)) });

        if (func) {
            // Function is not remote
            return func(arg);
        }

        const request: InvocationRequest<T> = {
            method: key,
            arg: arg!
        };

        return new Promise((resolve, reject) => {
            const handler = (response: InvocationResponse<R> | void): void => {
                if (!response) {
                    return reject("Missing response");
                }

                if (!response.method) {
                    return reject("Missing response method");
                }

                if ("error" in response) {
                    return reject(response.error);
                }

                return resolve(response.result);
            };

            if (browser.runtime) {
                browser.runtime.sendMessage(request)
                    .then(response => {
                        logger.debug("Successfully sent message", { method: key });
                        handler(response);
                    })
                    .catch(error => {
                        logger.warn("Failed to send message", {
                            method: key,
                            error: JSON.stringify(error)
                        });
                        reject(error);
                    });
            } else if (browser.tabs) {
                browser.tabs.query({})
                    .then(tabs => {
                        logger.debug("Successfully queried tabs", {
                            method: key,
                            count: String(tabs.length)
                        });

                        for (const tab of tabs) {
                            browser.tabs.sendMessage(tab.id!, request)
                                .then(response => {
                                    logger.debug("Successfully sent message to tab", {
                                        method: key,
                                        tab: String(tab.id)
                                    });
                                    handler(response);
                                })
                                .catch(error => {
                                    logger.warn("Failed to send message to tab", {
                                        method: key,
                                        tab: String(tab.id),
                                        error: JSON.stringify(error)
                                    });
                                });
                        }
                    })
                    .catch(error => {
                        logger.debug("Failed to query tabs", {
                            method: key,
                            error: JSON.stringify(error)
                        });
                    });
            }
        });
    }

    public async dispose(): Promise<void> {
        this.functions.clear();

        if (browser.runtime) {
            await browser.runtime.onMessage.removeListener(this.messageListener);
        }
    }

    @bind
    private messageListener(request: object | void): Promise<InvocationResponse<unknown>> | void {
        if (!request) {
            return;
        }

        if (typeof request !== "object") {
            return;
        }

        const invocationRequest = request as InvocationRequest<unknown>;
        const method = invocationRequest.method;
        const arg = invocationRequest.arg;

        if (typeof method !== "string") {
            return;
        }

        const func = this.functions.get(method);

        if (!func) {
            return;
        }

        logger.debug("Received message", { method });

        try {
            const returnValue = func(arg);

            if (returnValue instanceof Promise) {
                return returnValue.then((result: unknown) => {
                    return { method, result };
                }).catch(error => {
                    logger.warn("Failed to run async function", { method, error });

                    return { method, error };
                });
            } else {
                return Promise.resolve({ method, result: returnValue });
            }
        } catch (error) {
            logger.warn("Failed to run function", {
                method,
                error: JSON.stringify(error)
            });

            return Promise.resolve({ method, error });
        }
    }
}
