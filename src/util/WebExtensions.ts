import {
    Browser,
    Storage,
    Runtime,
    TabQueryFilter,
    Tabs,
    Tab as BrowserTab,
    OnChangedEvent as BrowserOnChangedEvent,
    OnMessageEvent as BrowserOnMessageEvent
} from "typings/Browser";
import {
    Chrome,
    Tab as ChromeTab,
    OnChangedEvent as ChromeOnChangedEvent,
    OnMessageEvent as ChromeOnMessageEvent
} from "typings/Chrome";
import { Logging } from "logger/Logging";

declare const chrome: Chrome | undefined;
declare const browser: Browser | undefined;
declare const window: unknown | undefined;

const logger = Logging.getLogger("WebExtensions");

class ChromeBrowserAdapter implements Browser {
    private readonly changeListeners: Map<BrowserOnChangedEvent, ChromeOnChangedEvent>;
    private readonly messageListeners: Map<BrowserOnMessageEvent, ChromeOnMessageEvent>;

    public constructor(
        private readonly chrome: Chrome
    ) {
        this.changeListeners = new Map();
        this.messageListeners = new Map();
    }

    public get storage(): Storage {
        return {
            local: {
                get: (keys?: string | string[] | object | null): Promise<object> => {
                    if (keys === undefined) {
                        return new Promise(resolve => {
                            this.chrome.storage.local.get(resolve);
                        });
                    } else {
                        return new Promise(resolve => {
                            this.chrome.storage.local.get(keys, resolve);
                        });
                    }
                },
                set: (keys: object): Promise<void> => {
                    return new Promise(resolve => {
                        this.chrome.storage.local.set(keys, resolve);
                    });
                },
                remove: (keys: string | string[]): Promise<void> => {
                    return new Promise(resolve => {
                        this.chrome.storage.local.remove(keys, resolve);
                    });
                },
                clear: (): Promise<void> => {
                    return new Promise(resolve => {
                        this.chrome.storage.local.clear(resolve);
                    });
                }
            },
            sync: {
                get: (keys?: string | string[] | object | null): Promise<object> => {
                    if (keys === undefined) {
                        return new Promise(resolve => {
                            this.chrome.storage.sync.get(resolve);
                        });
                    } else {
                        return new Promise(resolve => {
                            this.chrome.storage.sync.get(keys, resolve);
                        });
                    }
                },
                set: (keys: object): Promise<void> => {
                    return new Promise(resolve => {
                        this.chrome.storage.sync.set(keys, resolve);
                    });
                },
                remove: (keys: string | string[]): Promise<void> => {
                    return new Promise(resolve => {
                        this.chrome.storage.sync.remove(keys, resolve);
                    });
                },
                clear: (): Promise<void> => {
                    return new Promise(resolve => {
                        this.chrome.storage.sync.clear(resolve);
                    });
                }
            },
            onChanged: {
                addListener: (listener: BrowserOnChangedEvent): void => {
                    const wrapped: ChromeOnChangedEvent = (changes, storageType): void => {
                        if (storageType == "managed") {
                            return;
                        }

                        listener(changes, storageType);
                    };

                    this.changeListeners.set(listener, wrapped);
                    this.chrome.storage.onChanged.addListener(wrapped);
                },
                removeListener: (listener: BrowserOnChangedEvent): void => {
                    const wrapped = this.changeListeners.get(listener);

                    if (!wrapped) {
                        return;
                    }

                    this.changeListeners.delete(listener);
                    this.chrome.storage.onChanged.removeListener(wrapped);
                },
                hasListener: (listener: BrowserOnChangedEvent): boolean => {
                    const wrapped = this.changeListeners.get(listener);

                    if (!wrapped) {
                        return false;
                    }

                    return this.chrome.storage.onChanged.hasListener(wrapped);
                }
            }
        };
    }

    public get runtime(): Runtime | undefined {
        if (this.chrome.runtime === undefined) {
            return undefined;
        }

        return {
            id: this.chrome.runtime.id,
            lastError: this.chrome.runtime.lastError || null,
            onMessage: {
                addListener: (listener: BrowserOnMessageEvent): void => {
                    const wrapped: ChromeOnMessageEvent = (message, sender, sendResponse): boolean | void => {
                        const senderInfo = {
                            tab: sender.tab ? ChromeBrowserAdapter.toBrowserTab(sender.tab) : undefined,
                            frameId: sender.frameId,
                            id: sender.id,
                            url: sender.url,
                            tlsChannelId: sender.tlsChannelId
                        };

                        const result = listener(message, senderInfo, sendResponse as any);

                        if (result instanceof Promise) {
                            return true;
                        }

                        return result;
                    };

                    this.messageListeners.set(listener, wrapped);
                    this.chrome.runtime!.onMessage.addListener(wrapped);
                },
                removeListener: (listener: BrowserOnMessageEvent): void => {
                    const wrapped = this.messageListeners.get(listener);

                    if (!wrapped) {
                        return;
                    }

                    this.messageListeners.delete(listener);
                    this.chrome.runtime!.onMessage.removeListener(wrapped);
                },
                hasListener: (listener: BrowserOnMessageEvent): boolean => {
                    const wrapped = this.messageListeners.get(listener);

                    if (!wrapped) {
                        return false;
                    }

                    return this.chrome.runtime!.onMessage.hasListener(wrapped);
                }
            },
            sendMessage: (
                extensionId: string | any,
                message?: any | { includeTlsChannelId?: boolean; toProxyScript?: boolean },
                options?: { includeTlsChannelId?: boolean; toProxyScript?: boolean }
            ): Promise<object | void> => {
                if (typeof extensionId === "string") {
                    if (options !== undefined) {
                        return new Promise(resolve => {
                            this.chrome.runtime!.sendMessage(extensionId, message, options, resolve);
                        });
                    } else {
                        return new Promise(resolve => {
                            this.chrome.runtime!.sendMessage(extensionId, message, resolve);
                        });
                    }
                } else if (message !== undefined) {
                    return new Promise(resolve => {
                        this.chrome.runtime!.sendMessage(extensionId, message, resolve);
                    });
                } else {
                    return new Promise(resolve => {
                        this.chrome.runtime!.sendMessage(extensionId, resolve);
                    });
                }
            }
        };
    }

    public get tabs(): Tabs | undefined {
        if (this.chrome.tabs === undefined) {
            return undefined;
        }

        return {
            sendMessage: (
                tabId: number,
                message: any,
                options?: { frameId?: number }
            ): Promise<object | void> => {
                if (options) {
                    return new Promise(resolve => {
                        this.chrome.tabs!.sendMessage(tabId, message, options, (response) => {
                            resolve(response as object);
                        });
                    });
                } else {
                    return new Promise(resolve => {
                        this.chrome.tabs!.sendMessage(tabId, message, (response) => {
                            resolve(response as object);
                        });
                    });
                }
            },
            query: (filter: TabQueryFilter): Promise<BrowserTab[]> => {
                return new Promise((resolve => {
                    this.chrome.tabs!.query(filter, result => {
                        const tabs = result.map(ChromeBrowserAdapter.toBrowserTab);

                        resolve(tabs);
                    });
                }));
            }
        };
    }

    private static toBrowserTab(tab: ChromeTab): BrowserTab {
        return {
            active: tab.active,
            audible: tab.audible,
            autoDiscardable: tab.autoDiscardable,
            cookieStoreId: undefined,
            discarded: tab.discarded,
            favIconUrl: tab.favIconUrl,
            height: tab.height,
            hidden: tab.hidden,
            highlighted: tab.highlighted,
            id: tab.id,
            incognito: tab.incognito,
            index: tab.index,
            isArticle: false,
            isInReaderMode: false,
            lastAccessed: -1,
            openerTabId: tab.openerTabId,
            pinned: tab.pinned,
            selected: tab.selected,
            sessionId: tab.sessionId,
            status: tab.status,
            title: tab.title,
            url: tab.url,
            width: tab.width,
            windowId: tab.windowId
        };
    }
}

let cache: Browser | null = null;

export function getBrowser(): Browser {
    if (cache) {
        return cache;
    }

    logger.info("Resolving WebExtensions implementation");

    let result: Browser;

    if (typeof browser !== typeof undefined && browser) {
        logger.info("Detected browser global object, suggesting Firefox");
        logger.info("Using standard WebExtensions implementation");
        result = browser;
    } else if (typeof chrome !== typeof undefined && chrome) {
        logger.info("Detected chrome global object, suggesting Chrome");
        logger.info("Using Chrome WebExtensions adapter implementation");
        result = new ChromeBrowserAdapter(chrome);
    } else if (typeof window !== typeof undefined && window) {
        logger.warn("Detected window global object, suggesting unsupported browser");
        logger.info("Defaulting to standard WebExtensions implementation");
        result = window as Browser;
    } else {
        throw "Unable to resolve WebExtensions implementation";
    }

    cache = result;

    return result;
}
