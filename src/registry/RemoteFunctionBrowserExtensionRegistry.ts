import bind from "bind-decorator";
import { FunctionRegistry } from "registry/FunctionRegistry";

declare const chrome: any | undefined;
declare const browser: any | undefined;
declare const window: any | undefined;

// https://developer.chrome.com/extensions/tabs#type-Tab
type Tab = { id: string };

interface InvocationRequest<T> {
    method: string,
    arg: T
}

interface InvocationResponse<R> {
    method: string,
    error?: any,
    result?: R
}

export class RemoteFunctionBrowserExtensionRegistry implements FunctionRegistry {
    private static readonly METHOD_PREFIX: string = "__RemoteFunctionBrowserExtensionRegistry__";
    private readonly global: any;
    private readonly functions: Map<string, Function> = new Map();

    public constructor() {
        if (typeof chrome !== typeof undefined) {
            this.global = chrome;
        } else if (typeof browser !== typeof undefined) {
            this.global = browser;
        } else if (typeof window !== typeof undefined) {
            this.global = window;
        } else {
            this.global = {};
        }

        if (this.global.runtime) {
            this.global.runtime.onMessage.addListener(this.messageListener);
        }
    }

    public register<T, R>(key: string, action: (arg: T) => R): void {
        const method = `${ RemoteFunctionBrowserExtensionRegistry.METHOD_PREFIX }${ key }`;

        this.functions.set(method, action);
    }

    public unregister<T, R>(key: string): void {
        const method = `${ RemoteFunctionBrowserExtensionRegistry.METHOD_PREFIX }${ key }`;

        this.functions.delete(method);
    }

    public async invoke<T, R>(key: string, arg?: T): Promise<R> {
        const func = this.functions.get(key as string);

        if (func) {
            // Function is not remote
            return func(arg);
        }

        const method = `${ RemoteFunctionBrowserExtensionRegistry.METHOD_PREFIX }${ key }`;

        const request: InvocationRequest<T> = {
            method, arg: arg as T
        };

        return new Promise((resolve, reject) => {
            const handler = (response: InvocationResponse<R>) => {
                const error = this.global.runtime.lastError;

                if (error) {
                    return reject(error);
                }

                if (!response.method || response.error) {
                    return reject(response.error);
                }

                const result = response.result;

                return resolve(result);
            };

            if (this.global.runtime) {
                this.global.runtime.sendMessage(request, handler);
            } else if (this.global.tabs) {
                this.global.tabs.query({}, (tabs: Tab[]) => {
                    for (const tab of tabs) {
                        this.global.tabs.sendMessage(tab.id, request, handler);
                    }
                });
            }
        });
    }

    public dispose(): void {
        this.functions.clear();

        if (this.global.runtime) {
            this.global.runtime.onMessage.removeListener(this.messageListener);
        }
    }

    @bind
    private messageListener<T, R>(
        request: InvocationRequest<T>,
        sender: object,
        sendResponse: (response: InvocationResponse<R>) => void
    ): boolean {
        if (typeof request !== "object") {
            return false;
        }

        const method = request.method;
        const arg = request.arg;
        const prefix = RemoteFunctionBrowserExtensionRegistry.METHOD_PREFIX;

        if (typeof method !== "string") {
            return false;
        }

        if (!method.startsWith(prefix)) {
            // Message is not related to extension registry
            return false;
        }

        const func = this.functions.get(method);
        const response: InvocationResponse<R> = { method };

        if (func) {
            try {
                const result = func(arg);

                if (result instanceof Promise) {
                    result.then((actualResult: R) => {
                        response[ "result" ] = actualResult;
                        sendResponse(response);
                    }).catch((error: any) => {
                        response[ "error" ] = error;
                        sendResponse(response);
                    });

                    return true;
                } else {
                    response[ "result" ] = result;
                }
            } catch (error) {
                response[ "error" ] = error;
            }
        } else {
            const name = method.substring(prefix.length);

            response[ "error" ] = `No such function with name ${ name }`;
        }

        sendResponse(response);

        return false;
    }
}
