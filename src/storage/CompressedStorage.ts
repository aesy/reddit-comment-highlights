import bind from "bind-decorator";
import { decompressFromUTF16, compressToUTF16 } from "lz-string";
import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { Storage } from "storage/Storage";
import { Logging } from "logger/Logging";

const logger = Logging.getLogger("CompressedStorage");

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
        logger.debug("Compressing data");

        let compressed: string;

        try {
            compressed = this.compress(data);
        } catch (error) {
            logger.error("Failed to compress data", { error: JSON.stringify(error) });

            throw error;
        }

        logger.debug("Successfully compressed data");

        await this.delegate.save(compressed);
        this._onChange.dispatch(data);
    }

    public async load(): Promise<T | null> {
        const data = await this.delegate.load();

        logger.debug("Decompressing data");

        let decompressed: T | null;

        try {
            decompressed = this.decompress(data);
        } catch (error) {
            logger.error("Failed to decompress data", { error: JSON.stringify(error) });

            throw error;
        }

        logger.debug("Successfully decompressed data");

        return decompressed;
    }

    public async clear(): Promise<void> {
        logger.debug("Clearing storage");

        await this.delegate.clear();
    }

    public dispose(): void {
        logger.debug("Disposing storage");

        this._onChange.dispose();
        this.delegate.dispose();
    }

    @bind
    private onStorageChange(data: string | null): void {
        logger.debug("Underlying storage changed");
        logger.debug("Decompressing data");

        let decompressed: T | null;

        try {
            decompressed = this.decompress(data);
        } catch (error) {
            logger.error("Failed to decompress data", { error: JSON.stringify(error) });

            throw error;
        }

        logger.debug("Successfully decompressed data");

        this._onChange.dispatch(decompressed);
    }

    private compress(data: T | null): string {
        if (data === null) {
            return "";
        }

        return compressToUTF16(JSON.stringify(data));
    }

    private decompress(data: string | null): T | null {
        if (data === null) {
            return null;
        }

        return JSON.parse(decompressFromUTF16(data));
    }
}
