import bind from "bind-decorator";
import { compressToUTF16, decompressFromUTF16 } from "lz-string";
import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { Storage } from "storage/Storage";

export class CompressedStorage<T> implements Storage<T> {
    private readonly _onChange = new SyncEvent<T | null>();

    public constructor(
        private readonly delegate: Storage<string>
    ) {
        delegate.onChange.subscribe(this.onStorageChange);
    }

    public get onChange(): Subscribable<T | null> {
        return this._onChange;
    }

    public async save(data: T | null): Promise<void> {
        await this.delegate.save(this.compress(data));
        this._onChange.dispatch(data);
    }

    public async load(): Promise<T | null> {
        const data = await this.delegate.load();

        return this.decompress(data);
    }

    public async clear(): Promise<void> {
        await this.delegate.clear();
    }

    public dispose(): void {
        this._onChange.dispose();
        this.delegate.dispose();
    }

    @bind
    private onStorageChange(data: string | null): void {
        this._onChange.dispatch(this.decompress(data));
    }

    private compress(data: T | null): string {
        if (!data) {
            return "";
        }

        return compressToUTF16(JSON.stringify(data));
    }

    private decompress(data: string | null): T | null {
        if (!data) {
            return null;
        }

        return JSON.parse(decompressFromUTF16(data));
    }
}
