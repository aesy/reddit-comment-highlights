import bind from "bind-decorator";
import { Actions } from "common/Actions";
import { Constants } from "common/Constants";
import { onSettingsChanged, onThreadVisitedEvent } from "common/Events";
import { extensionFunctionRegistry } from "common/Registries";
import { ThreadHistory, ThreadHistoryEntry } from "history/ThreadHistory";
import { TruncatingThreadHistory } from "history/TruncatingThreadHistory";
import { DefaultExtensionOptions } from "options/DefaultExtensionOptions";
import { ExtensionOptions, Options } from "options/ExtensionOptions";
import {
    BrowserExtensionStorageType,
    PeriodicallyFlushedBrowserExtensionStorage
} from "storage/BrowserExtensionStorage";
import { CachedStorage } from "storage/CachedStorage";
import { CompressedStorage } from "storage/CompressedStorage";
import { Storage } from "storage/Storage";
import { StorageMigrator } from "storage/StorageMigrator";

class BackgroundScript {
    private constructor(
        private readonly optionsStorage: Storage<Partial<Options>>,
        private readonly threadStorage: Storage<ThreadHistoryEntry[]>,
        private readonly extensionOptions: ExtensionOptions,
        private readonly threadHistory: ThreadHistory
    ) {
        optionsStorage.onChange.subscribe(this.onOptionsChanged);
        extensionFunctionRegistry.register(Actions.GET_THREAD_BY_ID, this.getThreadById);
        extensionFunctionRegistry.register(Actions.SAVE_OPTIONS, this.saveOptions);
        extensionFunctionRegistry.register(Actions.GET_OPTIONS, this.getOptions);
        extensionFunctionRegistry.register(Actions.CLEAR_STORAGE, this.clearStorages);
        onThreadVisitedEvent.subscribe(this.onThreadVisisted);
    }

    public static async start(): Promise<BackgroundScript> {
        const optionsStorage = new CachedStorage(new PeriodicallyFlushedBrowserExtensionStorage(
            BrowserExtensionStorageType.SYNC,
            Constants.OPTIONS_STORAGE_KEY,
            Constants.STORAGE_UPDATE_INTERVAL_SECONDS));
        const extensionOptions = new DefaultExtensionOptions(
            optionsStorage, Constants.OPTIONS_DEFAULTS);
        const options = await extensionOptions.get();

        let threadStorage: Storage<ThreadHistoryEntry[]>;

        if (options.useCompression) {
            threadStorage = new CompressedStorage(new PeriodicallyFlushedBrowserExtensionStorage(
                BrowserExtensionStorageType.SYNC,
                Constants.THREAD_STORAGE_KEY,
                Constants.STORAGE_UPDATE_INTERVAL_SECONDS));
        } else {
            threadStorage = new PeriodicallyFlushedBrowserExtensionStorage(
                BrowserExtensionStorageType.SYNC,
                Constants.THREAD_STORAGE_KEY,
                Constants.STORAGE_UPDATE_INTERVAL_SECONDS);
        }

        threadStorage = new CachedStorage(threadStorage);

        const threadHistory = new TruncatingThreadHistory(
            threadStorage, options.threadRemovalTimeSeconds);
        const backgroundScript = new BackgroundScript(
            optionsStorage,
            threadStorage,
            extensionOptions,
            threadHistory);

        // Restart after settings changed
        extensionOptions.onChange.once(async () => {
            backgroundScript.stop();
            await BackgroundScript.start();
            onSettingsChanged.dispatch();
        });

        return backgroundScript;
    }

    public stop(): void {
        this.optionsStorage.dispose();
        this.threadStorage.dispose();
        this.extensionOptions.dispose();
        this.threadHistory.dispose();
        this.optionsStorage.onChange.unsubscribe(this.onOptionsChanged);

        extensionFunctionRegistry.unregister(Actions.GET_THREAD_BY_ID);
        extensionFunctionRegistry.unregister(Actions.SAVE_OPTIONS);
        extensionFunctionRegistry.unregister(Actions.GET_OPTIONS);
        extensionFunctionRegistry.unregister(Actions.CLEAR_STORAGE);
        onThreadVisitedEvent.unsubscribe(this.onThreadVisisted);
    }

    @bind
    private getThreadById(threadId: string): Promise<ThreadHistoryEntry | null> {
        return this.threadHistory.get(threadId);
    }

    @bind
    private async saveOptions(options: Partial<Options>): Promise<void> {
        await this.extensionOptions.set(options);
    }

    @bind
    private async getOptions(): Promise<Options> {
        return await this.extensionOptions.get();
    }

    @bind
    private async clearStorages(): Promise<void> {
        await Promise.all([
            this.extensionOptions.clear(),
            this.threadHistory.clear()
        ]);
    }

    @bind
    private onThreadVisisted(threadId: string): Promise<void> {
        return this.threadHistory.add(threadId);
    }

    @bind
    private async onOptionsChanged(): Promise<void> {
        this.stop();

        const script = await BackgroundScript.start();

        // TODO only migrate data if necessary
        await new StorageMigrator()
            .migrate(this.threadStorage, script.threadStorage);
    }
}

/* This file should really be called 'eventScript' as it's only loaded when needed */

(async function entrypoint(): Promise<void> {
    try {
        await BackgroundScript.start();
    } catch (error) {
        console.log(error);
    }
})();
