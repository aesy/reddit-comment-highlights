/* The type definitions are extended as needed */

export interface Listener<T extends Function> {
    addListener: (listener: T) => void;
}

// Storage

export interface StorageArea {
    get(callback: (items: object) => void): void;
    get(keys: string | string[] | object | null, callback: (items: object) => void): void;
    getBytesInUse(callback: (bytesInUse: number) => void): void;
    getBytesInUse(keys: string | string[] | null, callback: (bytesInUse: number) => void): void;
    set(items: object, callback?: () => void): void;
    remove(keys: string | string[], callback?: () => void): void;
    clear(callback?: () => void): void;
}

export interface StorageChange {
    oldValue?: any;
    newValue?: any;
}

export interface Changes {
    [ field: string ]: StorageChange;
}

export type StorageType = "sync" | "local" | "managed";

export interface Storage {
    readonly sync: StorageArea;
    readonly local: StorageArea;
    readonly managed: StorageArea;
    readonly onChanged: Listener<(changes: Changes, storageType: StorageType) => void>;
}

// Tabs

export interface Tab {
    active: boolean;
    audible?: boolean;
    autoDiscardable: boolean;
    discarded?: boolean;
    favIconUrl?: string;
    height?: number;
    hidden: boolean;
    highlighted: boolean;
    id?: number;
    incognito: boolean;
    index: number;
    // mutedInfo?: MutedInfo;
    openerTabId?: number;
    pendingUrl?: string;
    pinned: boolean;
    selected: boolean;
    sessionId?: string;
    status?: "loading" | "complete";
    title?: string;
    url?: string;
    width?: number;
    windowId: number;
}

export interface Tabs {
    sendMessage(
        tabId: number,
        message: any,
        options?: { frameId?: number },
        responseCallback?: (response: any) => void
    ): void;
    sendMessage(
        tabId: number,
        message: any,
        responseCallback?: (response: any) => void
    ): void;
    query(
        filter: {
            active?: boolean;
            audible?: boolean;
            autoDiscardable?: boolean;
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
            windowType?: "normal" | "popup" | "panel" | "app" | "devtools";
        },
        callback: (result: Tab[]) => void
    ): void;
}

// Runtime

export interface MessageSender {
    tab?: Tab;
    frameId?: number;
    id?: string;
    url?: string;
    nativeApplication?: string;
    tlsChannelId?: string;
}

type OnMessageEvent = (
    message: object,
    sender: MessageSender,
    sendResponse: (response: object) => Promise<void>
) => boolean | void;

export interface Runtime {
    readonly id: string;
    readonly lastError?: string;
    readonly onMessage: Listener<OnMessageEvent>;

    sendMessage(
        message: any,
        options?: { includeTlsChannelId?: boolean },
        responseCallback?: (response: any) => void
    ): void;
    sendMessage(
        extensionId: string,
        message: any,
        options?: { includeTlsChannelId?: boolean },
        responseCallback?: (response: any) => void
    ): void;
}

// Chrome

export interface Chrome {
    readonly storage: Storage;
    readonly runtime?: Runtime;
    readonly tabs?: Tabs;
}
