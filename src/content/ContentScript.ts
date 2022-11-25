import bind from "bind-decorator";
import { Actions } from "common/Actions";
import { Constants } from "common/Constants";
import { onSettingsChanged, onThreadVisitedEvent } from "common/Events";
import { extensionFunctionRegistry } from "common/Registries";
import { ThreadHistoryEntry } from "history/ThreadHistory";
import { CompoundSink } from 'logger/CompoundSink';
import { LogLevel } from "logger/Logger";
import { Logging } from "logger/Logging";
import { SentrySink } from 'logger/SentrySink';
import { Options } from "options/ExtensionOptions";
import { OldRedditCommentHighlighter } from "reddit/OldRedditCommentHighlighter";
import { OldRedditPage } from "reddit/OldRedditPage";
import { HighlighterOptions, RedditCommentHighlighter } from "reddit/RedditCommentHighlighter";
import { RedditComment, RedditCommentThread, RedditPage } from "reddit/RedditPage";

const logger = Logging.getLogger("ContentScript");

export class ContentScript {
    private currentThread: RedditCommentThread | null = null;

    private constructor(
        private readonly reddit: RedditPage,
        private readonly highlighter: RedditCommentHighlighter
    ) {
        reddit.onThreadOpened.subscribe(this.onThreadVisited);
    }

    public static async start(): Promise<ContentScript> {
        logger.info("Starting ContentScript");

        const options = await extensionFunctionRegistry.invoke<void, Options>(Actions.GET_OPTIONS);

        if (options.sendErrorReports) {
            Logging.setSink(new CompoundSink([
                Logging.getSink(),
                new SentrySink("ContentScript")
            ]));
        }

        if (options.debug) {
            logger.info("Enabling debug mode");
            Logging.setLogLevel(LogLevel.DEBUG);
        } else {
            Logging.setLogLevel(LogLevel.WARN);
        }

        let reddit: RedditPage;
        let highlighter: RedditCommentHighlighter;
        const highlightOptions: HighlighterOptions = {
            backgroundColor: options.backColor,
            backgroundColorDark: options.backNightColor,
            border: options.border,
            linkTextColor: options.linkColor,
            linkTextColorDark: options.linkNightColor,
            normalTextColor: options.frontColor,
            normalTextColorDark: options.frontNightColor,
            quoteTextColor: options.quoteTextColor,
            quoteTextColorDark: options.quoteTextNightColor,
            className: options.customCSSClassName,
            clearOnClick: options.clearCommentOnClick,
            customCSS: options.customCSS,
            includeChildren: options.clearCommentincludeChildren,
            transitionDurationSeconds: Constants.CSS_TRANSITION_DURATION_SECONDS
        };

        if (OldRedditPage.isSupported()) {
            logger.info("Detected old reddit page");
            reddit = new OldRedditPage();
            highlighter = new OldRedditCommentHighlighter(highlightOptions);
        } else {
            throw "Failed to start ContentScript. Reason: no suitable reddit page implementation found.";
        }

        const contentScript = new ContentScript(reddit, highlighter);

        // Restart after settings changed
        onSettingsChanged.once(async () => {
            logger.info("Restarting ContentScript", {
                reason: "ExtensionOptions changed"
            });

            contentScript.stop();

            try {
                await ContentScript.start();
            } catch (error) {
                logger.error("Failed to start BackgroundScript", { error: JSON.stringify(error) });

                throw error;
            }
        });

        logger.debug("Successfully started ContentScript");

        return contentScript;
    }

    public stop(): void {
        logger.info("Stopping ContentScript");

        this.reddit.dispose();
        this.highlighter.dispose();

        if (this.currentThread) {
            this.currentThread.dispose();
        } else {
            logger.debug("No thread to dispose");
        }

        logger.debug("Successfully stopped ContentScript");
    }

    @bind
    private async onThreadVisited(thread: RedditCommentThread): Promise<void> {
        logger.info("Thread visited", { threadId: thread.id });

        if (this.currentThread) {
            logger.debug("Disposing previous thread", { threadId: this.currentThread.id });
            this.currentThread.dispose();
        }

        this.currentThread = thread;

        if (thread.isAtRootLevel()) {
            // Only consider comment section viewed if at root level
            onThreadVisitedEvent.dispatch(thread.id);
        }

        thread.onCommentAdded.subscribe(this.highlightComments);

        await this.highlightComments(...thread.getAllComments());
    }

    @bind
    private async highlightComments(...comments: RedditComment[]): Promise<void> {
        if (!this.currentThread) {
            return;
        }

        const entry = await extensionFunctionRegistry.invoke<string, ThreadHistoryEntry | null>(
            Actions.GET_THREAD_BY_ID, this.currentThread.id);

        if (!entry) {
            // First time in comment section, no highlights
            return;
        }

        const timestamp = entry.timestamp * 1000;
        const user = this.reddit.getLoggedInUser();

        for (const comment of comments) {
            if (user && user === comment.author) {
                // Users own comment, skip
                continue;
            }

            if (!comment.time) {
                // Deleted comment, skip
                continue;
            }

            if (comment.time.valueOf() < timestamp) {
                // Comment already seen, skip
                continue;
            }

            this.highlighter.highlightComment(comment);
        }
    }
}
