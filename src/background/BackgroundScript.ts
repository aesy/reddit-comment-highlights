import { StorageMigrator } from "@/storage/StorageMigrator";
import { bind } from "bind-decorator";
import browser from "webextension-polyfill";
import { Actions } from "@/common/Actions";
import { Constants } from "@/common/Constants";
import { onOptionsChanged, onThreadVisitedEvent } from "@/common/Events";
import { extensionFunctionRegistry } from "@/common/Registries";
import { ThreadHistory, ThreadHistoryEntry } from "@/history/ThreadHistory";
import { LogLevel } from "@/logger/Logger";
import { Logging } from "@/logger/Logging";
import { ExtensionOptions, type Options } from "@/options/ExtensionOptions";
import { BrowserExtensionStorage } from "@/storage/BrowserExtensionStorage";
import { type Storage } from "@/storage/Storage";
import { CachedStorage } from "@/storage/CachedStorage";
import { CompressedStorage } from "@/storage/CompressedStorage";

const logger = Logging.getLogger("BackgroundScript");

export class BackgroundScript {
    private history: ThreadHistory | null = null;
    private options: ExtensionOptions | null = null;

    constructor() {
        extensionFunctionRegistry.register(
            Actions.GET_THREAD_BY_ID,
            this.getThreadById,
        );
        extensionFunctionRegistry.register(
            Actions.SAVE_OPTIONS,
            this.saveOptions,
        );
        extensionFunctionRegistry.register(
            Actions.GET_OPTIONS,
            this.getOptions,
        );
        extensionFunctionRegistry.register(
            Actions.CLEAR_STORAGE,
            this.clearStorages,
        );
        onThreadVisitedEvent.subscribe(this.onThreadVisited);
        onOptionsChanged.subscribe(this.onOptionsChanged);
    }

    public async start(): Promise<void> {
        logger.info("Starting BackgroundScript");

        const extensionOptions = await this.getExtensionOptions();
        const options = await extensionOptions.get();

        BackgroundScript.initializeLogger(options);

        logger.info("Successfully started BackgroundScript");
    }

    public stop(): void {
        logger.info("Stopping BackgroundScript");

        this.options?.dispose();
        this.options = null;

        this.history?.dispose();
        this.history = null;

        logger.debug("Successfully stopped BackgroundScript");
    }

    @bind
    private async getThreadById(
        threadId: string,
    ): Promise<ThreadHistoryEntry | null> {
        logger.info("Thread history entry requested", { threadId });

        let entry: ThreadHistoryEntry | null;

        try {
            const threadHistory = await this.getThreadHistory();
            entry = await threadHistory.get(threadId);
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
    private async saveOptions(values: Partial<Options>): Promise<void> {
        logger.info("Saving options");

        try {
            const extensionOptions = await this.getExtensionOptions();
            await extensionOptions.set(values);
        } catch (error) {
            logger.error("Failed to save options");

            throw error;
        }

        logger.debug("Successfully saved options");
    }

    @bind
    private async getOptions(): Promise<Options> {
        logger.info("Fetching options");

        let options: Options;

        try {
            const extensionOptions = await this.getExtensionOptions();
            options = await extensionOptions.get();
        } catch (error) {
            logger.error("Failed to fetch options", {
                error: JSON.stringify(error),
            });

            throw error;
        }

        logger.debug("Successfully fetched options");

        return options;
    }

    @bind
    private async clearStorages(): Promise<void> {
        logger.info("Clearing storages");

        try {
            const threadHistory = await this.getThreadHistory();
            const extensionOptions = await this.getExtensionOptions();

            await Promise.all([
                threadHistory.clear(),
                extensionOptions.clear(),
            ]);
        } catch (error) {
            logger.error("Failed to clear storages", {
                error: JSON.stringify(error),
            });

            throw error;
        }

        logger.debug("Successfully cleared storages");
    }

    @bind
    private async onThreadVisited(threadId: string): Promise<void> {
        logger.info("Saving thread in history", { threadId });

        try {
            const threadHistory = await this.getThreadHistory();
            await threadHistory.add(threadId);
        } catch (error) {
            logger.error("Failed to save thread in history", {
                threadId,
                error: JSON.stringify(error),
            });

            throw error;
        }

        logger.debug("Successfully saved thread in history", { threadId });
    }

    @bind
    public async onOptionsChanged(): Promise<void> {
        logger.info("Restarting BackgroundScript", {
            reason: "Options changed",
        });

        try {
            const oldHistory = await this.getThreadHistory();
            this.stop();
            await this.start();
            const newHistory = await this.getThreadHistory();

            await new StorageMigrator().migrate(
                oldHistory.storage,
                newHistory.storage,
            );
        } catch (error) {
            logger.error("Failed to migrate storage", {
                error: JSON.stringify(error),
            });

            throw error;
        }

        logger.debug("Successfully restarted BackgroundScript");
    }

    private async getThreadHistory(): Promise<ThreadHistory> {
        const createStorage = async (
            options: Options,
        ): Promise<Storage<ThreadHistoryEntry[]>> => {
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
                const browserStorage = new BrowserExtensionStorage<string>(
                    Constants.THREAD_STORAGE_NAME,
                    storageType,
                    Constants.THREAD_STORAGE_KEY,
                    browser,
                );
                threadStorage = new CompressedStorage(
                    Constants.THREAD_STORAGE_NAME,
                    browserStorage,
                );
            } else {
                threadStorage = new BrowserExtensionStorage<
                    ThreadHistoryEntry[]
                >(
                    Constants.THREAD_STORAGE_NAME,
                    storageType,
                    Constants.THREAD_STORAGE_KEY,
                    browser,
                );
            }

            return new CachedStorage(
                Constants.THREAD_STORAGE_NAME,
                threadStorage,
            );
        };

        if (this.history === null) {
            const extensionOptions = await this.getExtensionOptions();
            const options = await extensionOptions.get();
            const storage = await createStorage(options);
            this.history = new ThreadHistory(
                storage,
                options.threadRemovalTimeSeconds,
            );
        }

        return this.history;
    }

    private async getExtensionOptions(): Promise<ExtensionOptions> {
        if (this.options === null) {
            const browserStorage = new BrowserExtensionStorage<Options>(
                Constants.OPTIONS_STORAGE_NAME,
                "sync",
                Constants.OPTIONS_STORAGE_KEY,
                browser,
            );
            const optionsStorage = new CachedStorage(
                Constants.OPTIONS_STORAGE_NAME,
                browserStorage,
            );
            this.options = new ExtensionOptions(
                optionsStorage,
                Constants.OPTIONS_DEFAULTS,
            );
        }

        return this.options;
    }

    private static initializeLogger(options: Options): void {
        if (options.debug) {
            logger.info("Enabling debug mode");
            Logging.setLogLevel(LogLevel.DEBUG);
        } else {
            logger.info("Disabling debug mode");
            Logging.setLogLevel(LogLevel.WARN);
        }
    }

    public dispose(): void {
        this.stop();

        extensionFunctionRegistry.unregister(Actions.GET_THREAD_BY_ID);
        extensionFunctionRegistry.unregister(Actions.SAVE_OPTIONS);
        extensionFunctionRegistry.unregister(Actions.GET_OPTIONS);
        extensionFunctionRegistry.unregister(Actions.CLEAR_STORAGE);
        onThreadVisitedEvent.unsubscribe(this.onThreadVisited);
        onOptionsChanged.unsubscribe(this.onOptionsChanged);
    }
}
