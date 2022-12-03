import * as Sentry from "@sentry/browser";
import { Actions } from "common/Actions";
import { Constants } from "common/Constants";
import { extensionFunctionRegistry } from "common/Registries";
import { LogLevel } from "logger/Logger";
import { LogEvent, Sink } from "logger/Sink";
import { Options } from "options/ExtensionOptions";

/**
 * Sink that sends errors to Sentry.
 */
export class SentrySink implements Sink {
    public constructor(script: "BackgroundScript" | "ContentScript") {
        Sentry.init({
            dsn: Constants.SENTRY_DSN
        });
        Sentry.setExtras({
            script
        });
    }

    public emit(logEvent: LogEvent): void {
        if (logEvent.level === LogLevel.ERROR) {
            const options = extensionFunctionRegistry.invoke<void, Options>(Actions.GET_OPTIONS);

            Sentry.captureException(new Error(logEvent.message), {
                level: "error",
                extra: { options }
            });
        }
    }

    public async dispose(): Promise<void> {
        await Sentry.close();
    }
}
