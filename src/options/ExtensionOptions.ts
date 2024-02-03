import { bind } from "bind-decorator";
import { onOptionsChanged } from "@/common/Events";
import { Logging } from "@/logger/Logging";
import { type Storage } from "@/storage/Storage";

const logger = Logging.getLogger("ExtensionOptions");

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
}

export class ExtensionOptions {
    public constructor(
        public readonly storage: Storage<Partial<Options>>,
        public readonly defaults: Readonly<Options>,
    ) {
        storage.onChange.subscribe(this.onStorageChange);
    }

    public dispose(): void {
        this.storage.onChange.unsubscribe(this.onStorageChange);
    }

    public async get(): Promise<Options> {
        logger.debug("Reading ExtensionOptions");

        const data = await this.storage.load();

        return Object.assign({}, this.defaults, data);
    }

    public async set(values: Partial<Options>): Promise<void> {
        logger.debug("Saving ExtensionOptions");

        const oldData = await this.storage.load();
        const newData = Object.assign({}, oldData, values);
        const obj = newData as Record<string, unknown>;

        for (const key of Object.keys(obj)) {
            if (obj[key] === undefined) {
                delete obj[key];
            }
        }

        await this.storage.save(newData);
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing ExtensionOptions");

        await this.storage.clear();
    }

    @bind
    private async onStorageChange(): Promise<void> {
        logger.debug("ExtensionOptions underlying storage changed");

        const options = await this.get();

        onOptionsChanged.dispatch(options);
    }
}
