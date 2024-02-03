import { Logging } from "@/logger/Logging";
import {
    type HighlighterOptions,
    type RedditCommentHighlighter,
} from "@/reddit/RedditCommentHighlighter";
import { type RedditComment } from "@/reddit/RedditPage";
import { injectCSS } from "@/util/DOM";
import { wait } from "@/util/Time";

const logger = Logging.getLogger("OldRedditCommentHighlighter");

export class OldRedditCommentHighlighter implements RedditCommentHighlighter {
    private cssElement: Element | null = null;

    public constructor(private readonly options: HighlighterOptions) {
        this.addCss();
    }

    public highlightComment(comment: RedditComment): void {
        logger.info("Highlighting comment", {
            id: comment.id,
            time: comment.time.toISOString(),
            className: this.options.className,
        });

        comment.element.classList.add(this.options.className);
        comment.element.classList.add(`${this.options.className}--transition`);

        if (!this.options.clearOnClick) {
            return;
        }

        logger.debug("Installing click listener");

        comment.onClick.once(async () => {
            logger.info("Comment clicked", {
                id: comment.id,
            });

            // Comments to clear on click
            const clear: RedditComment[] = [];

            if (this.options.includeChildren) {
                const addComment = (comment: RedditComment): void => {
                    const comments = comment.getChildComments();

                    for (const comment of comments) {
                        addComment(comment);
                    }

                    clear.push(comment);
                };

                addComment(comment);
            } else {
                clear.push(comment);
            }

            logger.info("Clearing highlights", {
                count: String(clear.length),
            });

            for (const comment of clear) {
                comment.element.classList.remove(this.options.className);
            }

            // Transition class can't be removed before transition has finished
            await wait(this.options.transitionDurationSeconds * 1000 + 500);

            for (const comment of clear) {
                const className = `${this.options.className}--transition`;
                comment.element.classList.remove(className);
            }
        });
    }

    public dispose(): void {
        logger.debug("Disposing comment highlighter");
        this.removeCss();
    }

    private addCss(): void {
        logger.info("Injecting CSS");
        this.cssElement = injectCSS(this.getCSS(), document.head);
        logger.info("Successfully injected CSS");
    }

    private removeCss(): void {
        logger.info("Removing CSS");

        let removed = false;

        if (this.cssElement) {
            const element = document.head.removeChild(this.cssElement);
            removed = Boolean(element);
        }

        if (removed) {
            logger.info("Successfully removed CSS");
        } else {
            logger.warn("No CSS was removed");
        }
    }

    private getCSS(): string {
        logger.debug("Generating CSS");

        if (this.options.customCSS) {
            logger.debug("Using custom CSS");

            return this.options.customCSS;
        }

        let css = `
            .comment.${this.options.className}--transition  > .entry .md {
                transition-property: padding, border, background-color, color;
                transition-duration: ${this.options.transitionDurationSeconds}s;
            }

            .comment.${this.options.className} > .entry .md {
                padding: 2px;
                border: ${this.options.border || "0"};
                border-radius: 2px;
                background-color: ${this.options.backgroundColor};
                color: ${this.options.normalTextColor};
            }
        `;

        if (this.options.linkTextColor) {
            css += `
                .comment.${this.options.className} > .entry .md a {
                    color: ${this.options.linkTextColor};
                }
            `;
        }

        if (this.options.quoteTextColor) {
            css += `
                .comment.${this.options.className} > .entry .md blockquote {
                    color: ${this.options.quoteTextColor};
                }
            `;
        }

        css += `
            .res-nightmode .comment.${this.options.className} > .entry .md {
                padding: 2px;
                border: ${this.options.border || "0"};
                border-radius: 2px;
                background-color: ${this.options.backgroundColorDark};
                color: ${this.options.normalTextColorDark};
            }
        `;

        if (this.options.linkTextColorDark) {
            css += `
                .res-nightmode .comment.${this.options.className} > .entry .md a {
                    color: ${this.options.linkTextColorDark};
                }
            `;
        }

        if (this.options.quoteTextColorDark) {
            css += `
                .res-nightmode .comment.${this.options.className} > .entry .md blockquote {
                    color: ${this.options.quoteTextColorDark};
                }
            `;
        }

        logger.debug("Successfully generated CSS");

        return css;
    }
}
