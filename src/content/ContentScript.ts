import { bind } from "bind-decorator";
import { Actions } from "@/common/Actions";
import { Constants } from "@/common/Constants";
import { onOptionsChanged, onThreadVisitedEvent } from "@/common/Events";
import { extensionFunctionRegistry } from "@/common/Registries";
import { type ThreadHistoryEntry } from "@/history/ThreadHistory";
import { LogLevel } from "@/logger/Logger";
import { Logging } from "@/logger/Logging";
import { type Options } from "@/options/ExtensionOptions";
import { OldRedditCommentHighlighter } from "@/reddit/OldRedditCommentHighlighter";
import { OldRedditPage } from "@/reddit/OldRedditPage";
import {
    type HighlighterOptions,
    type RedditCommentHighlighter,
} from "@/reddit/RedditCommentHighlighter";
import {
    isAtRootLevel,
    type RedditComment,
    type RedditCommentThread,
    type RedditPage,
} from "@/reddit/RedditPage";
import { RedesignRedditCommentHighlighter } from "@/reddit/RedesignRedditCommentHighlighter";
import { RedesignRedditPage } from "@/reddit/RedesignRedditPage";

const logger = Logging.getLogger("ContentScript");

export class ContentScript {
    private reddit: RedditPage | null = null;
    private highlighter: RedditCommentHighlighter | null = null;
    private currentThread: RedditCommentThread | null = null;
    /**
     * number    === Unix timestamp
     * null      === First visit
     * undefined === Not yet known
     */
    private lastVisitedTimestamp: number | null | undefined = undefined;

    public constructor() {
        onOptionsChanged.subscribe(this.onOptionsChanged);
    }

    public async start(): Promise<void> {
        logger.info("Starting ContentScript");

        const options = await extensionFunctionRegistry.invoke<void, Options>(
            Actions.GET_OPTIONS,
        );

        ContentScript.initializeLogger(options);

        const highlightOptions = {
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
            transitionDurationSeconds:
                Constants.CSS_TRANSITION_DURATION_SECONDS,
        } satisfies HighlighterOptions;

        if (RedesignRedditPage.isSupported()) {
            logger.info("Detected redesign reddit page");
            this.reddit = new RedesignRedditPage(
                Constants.REDESIGN_EXTENSION_NAME,
            );
            this.highlighter = new RedesignRedditCommentHighlighter(
                highlightOptions,
            );
        } else if (OldRedditPage.isSupported()) {
            logger.info("Detected old reddit page");
            this.reddit = new OldRedditPage();
            this.highlighter = new OldRedditCommentHighlighter(
                highlightOptions,
            );
        } else {
            throw "Failed to start ContentScript. Reason: no suitable reddit page implementation found.";
        }

        this.reddit.onThreadOpened.subscribe(this.onThreadVisited);

        logger.debug("Successfully started ContentScript");
    }

    public stop(): void {
        logger.info("Stopping ContentScript");

        this.reddit?.dispose();
        this.reddit = null;

        this.highlighter?.dispose();
        this.highlighter = null;

        if (this.currentThread) {
            this.currentThread.dispose();
            this.currentThread = null;
        } else {
            logger.debug("No thread to dispose");
        }

        logger.debug("Successfully stopped ContentScript");
    }

    @bind
    private async onThreadVisited(thread: RedditCommentThread): Promise<void> {
        logger.info("Thread visited", { threadId: thread.id });

        this.lastVisitedTimestamp = undefined;

        if (this.currentThread) {
            logger.debug("Disposing previous thread", {
                threadId: this.currentThread.id,
            });
            this.currentThread.dispose();
        }

        this.currentThread = thread;

        logger.debug("Fetching thread history entry", {
            thread: this.currentThread.id,
        });

        const entry = await extensionFunctionRegistry.invoke<
            string,
            ThreadHistoryEntry | null
        >(Actions.GET_THREAD_BY_ID, thread.id);

        if (entry) {
            this.lastVisitedTimestamp = entry.timestamp * 1000;

            logger.debug("Thread history entry found", {
                thread: this.currentThread.id,
                lastVisited: new Date(this.lastVisitedTimestamp).toISOString(),
            });

            for (const comment of thread.getAllComments()) {
                if (this.shouldHighlightComment(comment)) {
                    this.highlightComment(comment);
                }
            }

            thread.onCommentAdded.subscribe((comment) => {
                if (this.shouldHighlightComment(comment)) {
                    this.highlightComment(comment);
                }
            });
        } else {
            this.lastVisitedTimestamp = null;

            logger.debug(
                "No thread history entry exists, meaning thread visited for the first time.",
                {
                    thread: this.currentThread.id,
                },
            );
        }

        if (isAtRootLevel()) {
            // Only consider comment section viewed if at root level
            onThreadVisitedEvent.dispatch(thread.id);
        }
    }

    private shouldHighlightComment(comment: RedditComment): boolean {
        const user = this.reddit?.getLoggedInUser();

        if (comment.isDeleted()) {
            // Don't highlight deleted comments
            return false;
        }

        if (user && user === comment.author) {
            // Don't highlight users' own comments
            return false;
        }

        if (comment.time.valueOf() < this.lastVisitedTimestamp!) {
            // Comment already seen, skip
            return false;
        }

        return true;
    }

    @bind
    private highlightComment(comment: RedditComment): void {
        logger.debug("Highlighting comment", {
            id: comment.id,
            created: comment.time.toISOString(),
        });

        this.highlighter?.highlightComment(comment);
    }

    @bind
    public async onOptionsChanged(): Promise<void> {
        logger.info("Restarting ContentScript", {
            reason: "Options changed",
        });

        try {
            this.stop();
            await this.start();
        } catch (error) {
            logger.error("Failed to restart ContentScript", {
                error: JSON.stringify(error),
            });

            throw error;
        }

        logger.debug("Successfully restarted ContentScript");
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

        onOptionsChanged.unsubscribe(this.onOptionsChanged);
    }
}
