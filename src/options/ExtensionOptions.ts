import { Subscribable } from "event/Event";

// These properties must keep their names for backwards compatibility
export interface Options {
    clearCommentOnClick: boolean;
    clearCommentincludeChildren: boolean;
    border: string | null;
    backColor: string;
    backNightColor: string;
    frontColor: string;
    frontNightColor: string;
    linkColor: string | null;
    linkNightColor: string | null;
    quoteTextColor: string | null;
    quoteTextNightColor: string | null;
    customCSS: string | null;
    customCSSClassName: string;
    threadRemovalTimeSeconds: number;
    useCompression: boolean;
    sync: boolean;
    debug: boolean;
    sendErrorReports: boolean;
}

export interface ExtensionOptions {
    readonly onChange: Subscribable<void>;

    get(): Promise<Options>;
    set(options: Partial<Options>): Promise<void>;
    clear(): Promise<void>;
    dispose(): void;
}
