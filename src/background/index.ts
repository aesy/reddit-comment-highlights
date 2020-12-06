import { BackgroundScript } from "background/BackgroundScript";
import { ConsoleSink } from "logger/ConsoleSink";
import { KeyValueLogger } from "logger/KeyValueLogger";
import { LogLevel } from "logger/Logger";
import { Logging } from "logger/Logging";

Logging.setLoggerFactory(KeyValueLogger.create);
Logging.setSink(new ConsoleSink());
Logging.setLogLevel(LogLevel.DEBUG);

const logger = Logging.getLogger("entrypoint");

/* This file should really be called 'eventScript' as it's only loaded when needed */

(async function entrypoint(): Promise<void> {
    logger.info("BackgroundScript loaded");

    try {
        await BackgroundScript.start();
    } catch (error) {
        logger.error("Failed to start BackgroundScript", { error: JSON.stringify(error) });
    }
})();
