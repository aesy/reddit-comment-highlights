import { ContentScript } from "content/ContentScript";
import { ConsoleSink } from "logger/ConsoleSink";
import { KeyValueLogger } from "logger/KeyValueLogger";
import { LogLevel } from "logger/Logger";
import { Logging } from "logger/Logging";

const logger = Logging.getLogger("entrypoint");

Logging.setLoggerFactory(KeyValueLogger.create);
Logging.setSink(new ConsoleSink());
Logging.setLogLevel(LogLevel.DEBUG);

/* This script is injected into every reddit page */

(async function entrypoint(): Promise<void> {
    logger.info("ContentScript loaded");

    try {
        await ContentScript.start();
    } catch (error) {
        logger.error("Failed to start ContentScript", { error: JSON.stringify(error) });
    }
})();
