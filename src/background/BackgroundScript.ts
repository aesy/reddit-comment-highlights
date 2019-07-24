import bind from "bind-decorator";
import { Storage } from "storage/Storage";
import { ThreadHistory, ThreadHistoryEntry } from "storage/ThreadHistory";
import {
    BrowserExtensionStorageType,
    PeriodicallyFlushedBrowserExtensionStorage
} from "storage/BrowserExtensionStorage";
import { ExtensionOptions, Options } from "options/ExtensionOptions";
import { Actions } from "common/Actions";
import { Constants } from "common/Constants";
import { onThreadVisitedEvent } from "common/Events";
import { extensionFunctionRegistry } from "common/Registries";

class BackgroundScript {
    private constructor(
        private readonly optionsStorage: Storage<Partial<Options>>,
        private readonly threadStorage: Storage<ThreadHistoryEntry[]>,
        private readonly extensionOptions: ExtensionOptions,
        private readonly threadHistory: ThreadHistory
    ) {
        extensionFunctionRegistry.register(Actions.GET_THREAD_BY_ID, this.getThreadById);
        extensionFunctionRegistry.register(Actions.SAVE_OPTIONS, this.saveOptions);
        extensionFunctionRegistry.register(Actions.GET_OPTIONS, this.getOptions);
        extensionFunctionRegistry.register(Actions.CLEAR_STORAGE, this.clearStorages);
        onThreadVisitedEvent.subscribe(this.onThreadVisisted);
    }

    public static async start(): Promise<BackgroundScript> {
        const optionsStorage = new PeriodicallyFlushedBrowserExtensionStorage<Partial<Options>>(
            BrowserExtensionStorageType.SYNC,
            Constants.OPTIONS_STORAGE_KEY,
            Constants.STORAGE_UPDATE_INTERVAL_SECONDS);
        const threadStorage = new PeriodicallyFlushedBrowserExtensionStorage<ThreadHistoryEntry[]>(
            BrowserExtensionStorageType.SYNC,
            Constants.THREAD_STORAGE_KEY,
            Constants.STORAGE_UPDATE_INTERVAL_SECONDS);
        const extensionOptions = new ExtensionOptions(optionsStorage, Constants.OPTIONS_DEFAULTS);
        const options = await extensionOptions.get();
        const threadHistory = new ThreadHistory(threadStorage, options.threadRemovalTimeSeconds);
        const backgroundScript = new BackgroundScript(
            optionsStorage,
            threadStorage,
            extensionOptions,
            threadHistory);

        // Restart after settings changed
        extensionOptions.onChange.once(async () => {
            backgroundScript.stop();
            await BackgroundScript.start();
        });

        return backgroundScript;
    }

    public stop(): void {
        this.optionsStorage.dispose();
        this.threadStorage.dispose();
        this.extensionOptions.dispose();
        this.threadHistory.dispose();

        extensionFunctionRegistry.unregister(Actions.GET_THREAD_BY_ID);
        extensionFunctionRegistry.unregister(Actions.SAVE_OPTIONS);
        extensionFunctionRegistry.unregister(Actions.GET_OPTIONS);
        extensionFunctionRegistry.unregister(Actions.CLEAR_STORAGE);
        onThreadVisitedEvent.unsubscribe(this.onThreadVisisted);
    }

    @bind
    private getThreadById(threadId: string): ThreadHistoryEntry | null {
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
    private onThreadVisisted(threadId: string): void {
        this.threadHistory.add(threadId);
    }
}

/* This file should really be called 'eventScript' as it's only loaded when needed */

(async function entrypoint(): Promise<void> {
    try {
        await BackgroundScript.start()
    } catch (error) {
        console.log(error);
    }
})();
