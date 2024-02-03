import { ContentScript } from "@/content/ContentScript";
import { ConsoleSink } from "@/logger/ConsoleSink";
import { KeyValueLogger } from "@/logger/KeyValueLogger";
import { LogLevel } from "@/logger/Logger";
import { Logging } from "@/logger/Logging";

/* This script is injected into every reddit page */

Logging.setLoggerFactory(KeyValueLogger.create);
Logging.setSink(new ConsoleSink());
Logging.setLogLevel(LogLevel.DEBUG);

const logger = Logging.getLogger("entrypoint");

let script: ContentScript | null = null;

try {
    script = new ContentScript();
} catch (error) {
    handleError(error);
}

script?.start().catch(handleError);

function handleError(error: unknown): void {
    logger.error("Failed to start ContentScript", {
        error: JSON.stringify(error),
    });
    script?.dispose();
}
