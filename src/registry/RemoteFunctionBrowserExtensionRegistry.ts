import bind from "bind-decorator";
import { Browser } from "webextension-polyfill";
import { FunctionRegistry } from "registry/FunctionRegistry";

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

    public constructor(
        private readonly browser: Browser
    ) {
        if (this.browser.runtime) {
            this.browser.runtime.onMessage.addListener(this.messageListener);
        }
    }

    public register<T, R>(key: string, action: (arg: T) => R): void {
        this.functions.set(key, action);
    }

    public unregister(key: string): void {
        this.functions.delete(key);
    }

    public async invoke<T, R>(key: string, arg?: T): Promise<R> {
        const func = this.functions.get(key as string);

        if (func) {
            // Function is not remote
            return func(arg);
        }

        const request: InvocationRequest<T> = {
            method: key,
            arg: arg!
        };

        return new Promise((resolve, reject) => {
            const handler = (response: object | void): void => {
                const error = this.browser.runtime.lastError;

                if (error) {
                    return reject(error);
                }

                const invocationResponse = response as InvocationResponse<R>;

                if (!invocationResponse) {
                    return reject();
                }

                if (!invocationResponse.method) {
                    return reject();
                }

                if ("error" in invocationResponse) {
                    return reject(invocationResponse.error);
                }

                return resolve(invocationResponse.result);
            };

            if (this.browser.runtime) {
                this.browser.runtime.sendMessage(request)
                    .then(handler)
                    .catch(reject);
            } else if (this.browser.tabs) {
                this.browser.tabs.query({})
                    .then(async tabs => {
                        for (const tab of tabs) {
                            await this.browser.tabs.sendMessage(tab.id!, request)
                                .then(handler);
                        }
                    })
                    .catch(reject);
            }
        });
    }

    public dispose(): void {
        this.functions.clear();

        if (this.browser.runtime) {
            this.browser.runtime.onMessage.removeListener(this.messageListener);
        }
    }

    @bind
    private messageListener(request: object | void): Promise<InvocationResponse<unknown>> | void {
        if (!request) {
            return;
        }

        const invocationRequest = request as InvocationRequest<unknown>;
        const method = invocationRequest.method;
        const arg = invocationRequest.arg;

        if (typeof method !== "string") {
            return;
        }

        const func = this.functions.get(method);

        if (func) {
            try {
                const returnValue = func(arg);

                if (returnValue instanceof Promise) {
                    return returnValue.then((result: unknown) => {
                        return { method, result };
                    }).catch((error: unknown) => {
                        return { method, error };
                    });
                } else {
                    return Promise.resolve({ method, result: returnValue });
                }
            } catch (error) {
                return Promise.resolve({ method, error });
            }
        } else {
            return Promise.resolve({
                method,
                error: `No such function with name ${ method }`
            });
        }
    }
}
