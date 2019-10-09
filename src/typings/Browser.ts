/* The type definitions are extended as needed */

export interface Listener<T extends Function> {
    addListener: (listener: T) => void;
    removeListener: (listener: T) => void;
    hasListener: (listener: T) => boolean;
}

// Storage

export interface StorageArea {
    get(keys?: string | string[] | object | null): Promise<object>;
    set(keys: object): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
    clear(): Promise<void>;
}

export interface StorageChange {
    oldValue?: any;
    newValue?: any;
}

export interface Changes {
    [ field: string ]: StorageChange;
}

export type StorageType = "sync" | "local";

export interface Storage {
    readonly sync: StorageArea;
    readonly local: StorageArea;
    readonly onChanged: Listener<(changes: Changes, storageType: StorageType) => void>;
}

// Tabs

export interface Tab {
    active: boolean;
    audible?: boolean;
    autoDiscardable?: boolean;
    cookieStoreId?: string;
    discarded?: boolean;
    favIconUrl?: string;
    height?: number;
    hidden: boolean;
    highlighted: boolean;
    id?: number;
    incognito: boolean;
    index: number;
    isArticle: boolean;
    isInReaderMode: boolean;
    lastAccessed: number;
    // mutedInfo?: MutedInfo;
    openerTabId?: number;
    pinned: boolean;
    selected: boolean;
    sessionId?: string;
    status?: "loading" | "complete";
    title?: string;
    url?: string;
    width?: number;
    windowId: number;
}

export interface TabQueryFilter {
    active?: boolean;
    audible?: boolean;
    cookieStoreId?: string;
    currentWindow?: boolean;
    discarded?: boolean;
    hidden?: boolean;
    highlighted?: boolean;
    index?: number;
    muted?: boolean;
    lastFocusedWindow?: boolean;
    pinned?: boolean;
    status?: "loading" | "complete";
    title?: string;
    url?: string | string[];
    windowId?: number;
    windowType?: "normal" | "popup" | "panel" | "devtools";
}

export interface Tabs {
    sendMessage(
        tabId: number,
        message: any,
        options?: { frameId?: number }
    ): Promise<object | void>;
    query(filter: TabQueryFilter): Promise<Tab[]>;
}

// Runtime

export interface MessageSender {
    tab?: Tab;
    frameId?: number;
    id?: string;
    url?: string;
    tlsChannelId?: string;
}

type OnMessagePromise = (
    message: object,
    sender: MessageSender,
    sendResponse: (response: object) => boolean
) => Promise<void>;

type OnMessageBool = (
    message: object,
    sender: MessageSender,
    sendResponse: (response: object) => Promise<void>
) => boolean | void;

export type OnMessageEvent = OnMessagePromise | OnMessageBool;

export interface Runtime {
    readonly id: string;
    readonly lastError: string | null;
    readonly onMessage: Listener<OnMessageEvent>;

    sendMessage(
        message: any,
        options?: { includeTlsChannelId?: boolean; toProxyScript?: boolean }
    ): Promise<any>;
    sendMessage(
        extensionId: string,
        message: any,
        options?: { includeTlsChannelId?: boolean; toProxyScript?: boolean }
    ): Promise<any>;
}

// Browser

export interface Browser {
    readonly storage: Storage;
    readonly runtime?: Runtime;
    readonly tabs?: Tabs;
}
