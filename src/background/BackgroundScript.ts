import bind from "bind-decorator";
import { Actions } from "common/Actions";
import { Constants } from "common/Constants";
import { onOptionsChanged, onThreadVisitedEvent } from "common/Events";
import { extensionFunctionRegistry } from "common/Registries";
import { ThreadHistory, ThreadHistoryEntry } from "history/ThreadHistory";
import { TruncatingThreadHistory } from "history/TruncatingThreadHistory";
import { CompoundSink } from "logger/CompoundSink";
import { LogLevel } from "logger/Logger";
import { Logging } from "logger/Logging";
import { SentrySink } from "logger/SentrySink";
import { DefaultExtensionOptions } from "options/DefaultExtensionOptions";
import { ExtensionOptions, Options } from "options/ExtensionOptions";
import { BrowserExtensionStorage } from "storage/BrowserExtensionStorage";
import { CachedStorage } from "storage/CachedStorage";
import { CompressedStorage } from "storage/CompressedStorage";
import { Storage } from "storage/Storage";
import { StorageMigrator } from "storage/StorageMigrator";

const logger = Logging.getLogger("BackgroundScript");

export class BackgroundScript {
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
        onThreadVisitedEvent.subscribe(this.onThreadVisited);
    }

    public static async start(): Promise<BackgroundScript> {
        const optionsStorage = new CachedStorage(Constants.OPTIONS_STORAGE_NAME, new BrowserExtensionStorage(
            Constants.OPTIONS_STORAGE_NAME,
            "sync",
            Constants.OPTIONS_STORAGE_KEY));
        const extensionOptions = new DefaultExtensionOptions(
            optionsStorage, Constants.OPTIONS_DEFAULTS);
        const options = await extensionOptions.get();

        if (options.sendErrorReports) {
            Logging.setSink(new CompoundSink([
                Logging.getSink(),
                new SentrySink("BackgroundScript")
            ]));
        }

        if (options.debug) {
            logger.info("Enabling debug mode");
            Logging.setLogLevel(LogLevel.DEBUG);
        } else {
            logger.info("Disabling debug mode");
            Logging.setLogLevel(LogLevel.WARN);
        }

        let threadStorage: Storage<ThreadHistoryEntry[]>;
        let storageType: "sync" | "local";

        if (options.sync) {
            logger.info("Using sync thread storage");
            storageType = "sync";
        } else {
            logger.info("Using local thread storage");
            storageType = "local";
        }

        if (options.useCompression) {
            logger.info("Enabling storage compression");

            threadStorage = new CompressedStorage(Constants.THREAD_STORAGE_NAME, new BrowserExtensionStorage(
                Constants.THREAD_STORAGE_NAME,
                storageType,
                Constants.THREAD_STORAGE_KEY));
        } else {
            threadStorage = new BrowserExtensionStorage(
                Constants.THREAD_STORAGE_NAME,
                storageType,
                Constants.THREAD_STORAGE_KEY);
        }

        threadStorage = new CachedStorage(Constants.THREAD_STORAGE_NAME, threadStorage);

        const threadHistory = new TruncatingThreadHistory(
            threadStorage, options.threadRemovalTimeSeconds);

        return new BackgroundScript(
            optionsStorage,
            threadStorage,
            extensionOptions,
            threadHistory);
    }

    public stop(): void {
        logger.info("Stopping BackgroundScript");

        this.optionsStorage.dispose();
        this.threadStorage.dispose();
        this.extensionOptions.dispose();
        this.threadHistory.dispose();
        this.optionsStorage.onChange.unsubscribe(this.onOptionsChanged);

        extensionFunctionRegistry.unregister(Actions.GET_THREAD_BY_ID);
        extensionFunctionRegistry.unregister(Actions.SAVE_OPTIONS);
        extensionFunctionRegistry.unregister(Actions.GET_OPTIONS);
        extensionFunctionRegistry.unregister(Actions.CLEAR_STORAGE);
        onThreadVisitedEvent.unsubscribe(this.onThreadVisited);

        logger.debug("Successfully stopped BackgroundScript");
    }

    @bind
    private async getThreadById(threadId: string): Promise<ThreadHistoryEntry | null> {
        logger.info("Thread history entry requested", { threadId });

        let entry: ThreadHistoryEntry | null;

        try {
            entry = await this.threadHistory.get(threadId);
        } catch (error) {
            logger.error("Failed to get thread history entry", { threadId });

            throw error;
        }

        if (entry) {
            logger.debug("Thread history entry found", { threadId });
        } else {
            logger.debug("Thread history entry not found", { threadId });
        }

        return entry;
    }

    @bind
    private async saveOptions(options: Partial<Options>): Promise<void> {
        logger.info("Saving options");

        try {
            await this.extensionOptions.set(options);
        } catch (error) {
            logger.error("Failed to save options");

            throw error;
        }

        logger.debug("Successfully saved options");
    }

    @bind
    private async getOptions(): Promise<Options> {
        logger.debug("Options requested");
        logger.info("Fetching options");

        let options: Options;

        try {
            options = await this.extensionOptions.get();
        } catch (error) {
            logger.error("Failed to fetch options", { error: JSON.stringify(error) });

            throw error;
        }

        logger.debug("Successfully fetched options");

        return options;
    }

    @bind
    private async clearStorages(): Promise<void> {
        logger.debug("Storage reset requested");
        logger.info("Clearing storages");

        try {
            await Promise.all([
                this.extensionOptions.clear(),
                this.threadHistory.clear()
            ]);
        } catch (error) {
            logger.error("Failed to clear storages", { error: JSON.stringify(error) });

            throw error;
        }

        logger.debug("Successfully cleared storages");
    }

    @bind
    private async onThreadVisited(threadId: string): Promise<void> {
        logger.debug("Thread visit notification", { threadId });
        logger.info("Saving thread in history", { threadId });

        try {
            await this.threadHistory.add(threadId);
        } catch (error) {
            logger.error("Failed to save thread in history",
                { threadId, error: JSON.stringify(error) });

            throw error;
        }

        logger.debug("Successfully saved thread in history", { threadId });
    }

    @bind
    private async onOptionsChanged(): Promise<void> {
        logger.info("Restarting BackgroundScript", {
            reason: "ExtensionOptions changed"
        });

        this.stop();

        let script: BackgroundScript;

        try {
            script = await BackgroundScript.start();
        } catch (error) {
            logger.error("Failed to start BackgroundScript", { error: JSON.stringify(error) });

            throw error;
        }

        try {
            await new StorageMigrator()
                .migrate(this.threadStorage, script.threadStorage);
        } catch (error) {
            logger.error("Failed to migrate storage", { error: JSON.stringify(error) });

            throw error;
        }

        onOptionsChanged.dispatch();
    }
}
