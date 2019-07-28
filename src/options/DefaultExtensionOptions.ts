import bind from "bind-decorator";
import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { Storage } from "storage/Storage";
import { ExtensionOptions, Options } from "options/ExtensionOptions";

export class DefaultExtensionOptions implements ExtensionOptions {
    private readonly _onChange = new SyncEvent<void>();

    public constructor(
        private readonly storage: Storage<Partial<Options>>,
        private readonly defaults: Readonly<Options>
    ) {
        storage.onChange.subscribe(this.onStorageChange);
    }

    public get onChange(): Subscribable<void> {
        return this._onChange;
    }

    public async get(): Promise<Options> {
        const data = await this.storage.load();

        return Object.assign({}, this.defaults, data);
    }

    public async set(options: Partial<Options>): Promise<void> {
        const oldData = await this.storage.load();
        const newData = Object.assign({}, oldData, options);
        const obj = newData as { [ key: string ]: any };

        for (const key in obj) {
            if (obj[ key ] === undefined) {
                delete obj[ key ];
            }
        }

        await this.storage.save(newData);
    }

    public async clear(): Promise<void> {
        await this.storage.clear();
    }

    public dispose(): void {
        this.storage.onChange.unsubscribe(this.onStorageChange);
        this._onChange.dispose();
    }

    @bind
    private onStorageChange(data: Partial<Options> | null): void {
        this._onChange.dispatch();
    }
}
