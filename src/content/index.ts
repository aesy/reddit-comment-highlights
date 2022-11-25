import { ContentScript } from "content/ContentScript";
import { ConsoleSink } from "logger/ConsoleSink";
import { KeyValueLogger } from "logger/KeyValueLogger";
import { LogLevel } from "logger/Logger";
import { Logging } from "logger/Logging";
import { OldRedditPage } from 'reddit/OldRedditPage';

const logger = Logging.getLogger("entrypoint");

Logging.setLoggerFactory(KeyValueLogger.create);
Logging.setSink(new ConsoleSink());
Logging.setLogLevel(LogLevel.DEBUG);

/* This script is injected into every reddit page */

(async function entrypoint(): Promise<void> {
    logger.info("ContentScript loaded");

    if (!OldRedditPage.isSupported()) {
        logger.warn("Skipping initialization. Reason: not supported.");
        return;
    }

    try {
        await ContentScript.start();
    } catch (error) {
        logger.error("Failed to start ContentScript", { error: JSON.stringify(error) });
    }
})();
