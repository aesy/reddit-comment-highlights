import bind from "bind-decorator";
import { Options } from "options/ExtensionOptions";
import { RedditComment, RedditCommentThread, RedditPage } from "reddit/RedditPage";
import { OldRedditPage } from "reddit/OldRedditPage";
import { HighlighterOptions, RedditCommentHighlighter } from "reddit/RedditCommentHighlighter";
import { OldRedditCommentHighlighter } from "reddit/OldRedditCommentHighlighter";
import { ThreadHistoryEntry } from "storage/ThreadHistory";
import { Actions } from "common/Actions";
import { Constants } from "common/Constants";
import { onSettingsChanged, onThreadVisitedEvent } from "common/Events";
import { extensionFunctionRegistry } from "common/Registries";

class ContentScript {
    private currentThread: RedditCommentThread | null = null;

    private constructor(
        private readonly reddit: RedditPage,
        private readonly highlighter: RedditCommentHighlighter
    ) {
        reddit.onThreadOpened.subscribe(this.onThreadVisited);
    }

    public static async start(): Promise<ContentScript> {
        const options = await extensionFunctionRegistry.invoke<void, Options>(Actions.GET_OPTIONS);
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
            reddit = new OldRedditPage();
            highlighter = new OldRedditCommentHighlighter(highlightOptions);
        } else {
            throw "Failed to initialize content script. Reason: no suitable reddit page implementation found.";
        }

        const contentScript = new ContentScript(reddit, highlighter);

        // Restart after settings changed
        onSettingsChanged.once(async () => {
            contentScript.stop();
            await ContentScript.start();
        });

        return contentScript;
    }

    public stop(): void {
        this.reddit.dispose();
        this.highlighter.dispose();

        if (this.currentThread) {
            this.currentThread.dispose();
        }
    }

    @bind
    private async onThreadVisited(thread: RedditCommentThread): Promise<void> {
        if (this.currentThread) {
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

/* This script is injected into every reddit page */

(async function entrypoint(): Promise<void> {
    try {
        await ContentScript.start()
    } catch (error) {
        console.log(error);
    }
})();
