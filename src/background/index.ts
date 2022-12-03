import { BackgroundScript } from "background/BackgroundScript";
import { ConsoleSink } from "logger/ConsoleSink";
import { KeyValueLogger } from "logger/KeyValueLogger";
import { LogLevel } from "logger/Logger";
import { Logging } from "logger/Logging";

Logging.setLoggerFactory(KeyValueLogger.create);
Logging.setSink(new ConsoleSink());
Logging.setLogLevel(LogLevel.DEBUG);

const logger = Logging.getLogger("entrypoint");

/* This script loads only when necessary and suspends when not needed */

logger.info("Starting BackgroundScript");

BackgroundScript.start()
    .then(() => logger.debug("Successfully started BackgroundScript"))
    .catch(error => logger.error("Failed to start BackgroundScript", { error: JSON.stringify(error) }));
