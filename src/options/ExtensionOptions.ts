import bind from "bind-decorator";
import { Event, Subscribable } from "event/Event";
import { Storage } from "storage/Storage";

export interface Options {
    usesRES: boolean | null
    clearCommentOnClick: boolean
    clearCommentincludeChildren: boolean
    border: string | null
    backColor: string
    backNightColor: string
    frontColor: string
    frontNightColor: string
    linkColor: string | null
    linkNightColor: string | null
    quoteTextColor: string | null
    quoteTextNightColor: string | null
    customCSS: string | null
    customCSSClassName: string
    threadRemovalTimeSeconds: number
    useCompression: boolean
}

export class ExtensionOptions {
    private readonly _onChange: Event<void> = new Event();
    private readonly init: Promise<void>;
    private cache: Partial<Options> = {};

    public constructor(
        private readonly storage: Storage<Partial<Options>>,
        private readonly defaults: Options
    ) {
        // Listen for changes in storage and update internal cache
        storage.onChange.subscribe(this.onStorageChange);

        // Sync internal cache with storage
        this.init = storage.load().then(this.onStorageChange);
    }

    public get onChange(): Subscribable<void> {
        return this._onChange;
    }

    public async get(): Promise<Options> {
        await this.init;

        return Object.assign({}, this.defaults, this.cache);
    }

    public async set(options: Partial<Options>): Promise<void> {
        await this.init;

        this.cache = Object.assign({}, this.cache, options);

        const obj = this.cache as { [ key: string ]: any };

        for (const key in obj) {
            if (obj[ key ] === undefined) {
                delete obj[ key ];
            }
        }

        await this.storage.save(this.cache);
    }

    public async clear(): Promise<void> {
        this.cache = {};

        await this.storage.clear();
    }

    public dispose(): void {
        this.storage.onChange.unsubscribe(this.onStorageChange);
        this._onChange.dispose();
    }

    @bind
    private onStorageChange(data: Partial<Options> | null): void {
        this.cache = data || {};

        this._onChange.dispatch();
    }
}
