import { BackgroundScript } from "@/background/BackgroundScript";
import { ConsoleSink } from "@/logger/ConsoleSink";
import { KeyValueLogger } from "@/logger/KeyValueLogger";
import { LogLevel } from "@/logger/Logger";
import { Logging } from "@/logger/Logging";

/* This script loads only when necessary and suspends when not needed */

Logging.setLoggerFactory(KeyValueLogger.create);
Logging.setSink(new ConsoleSink());
Logging.setLogLevel(LogLevel.DEBUG);

const logger = Logging.getLogger("entrypoint");

let script: BackgroundScript | null = null;

try {
    script = new BackgroundScript();
} catch (error) {
    handleError(error);
}

script?.start().catch(handleError);

function handleError(error: unknown): void {
    logger.error("Failed to start BackgroundScript", {
        error: JSON.stringify(error),
    });
    script?.dispose();
}
