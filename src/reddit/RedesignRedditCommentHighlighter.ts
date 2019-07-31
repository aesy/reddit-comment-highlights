import bind from "bind-decorator";
import { Logging } from "logger/Logging";
import { HighlighterOptions, RedditCommentHighlighter } from 'reddit/RedditCommentHighlighter';
import { RedditComment } from 'reddit/RedditPage';
import { hexToRgb, relativeLuminance } from "util/Color";
import { injectCSS } from "util/DOM";
import { wait } from 'util/Time';

const logger = Logging.getLogger("RedesignRedditCommentHighlighter");

export class RedesignRedditCommentHighlighter implements RedditCommentHighlighter {
    private darkModeObserver: MutationObserver | null = null;
    private cssElement: Element | null = null;

    public constructor(
        private readonly options: HighlighterOptions
    ) {
        this.addCss();
    }

    public highlightComment(comment: RedditComment): void {
        logger.info("Highlighting comment", {
            id: comment.id,
            time: comment.time.toISOString(),
            className: this.options.className
        });

        comment.element.classList.add(this.options.className);
        comment.element.classList.add(`${ this.options.className }--transition`);

        if (!this.options.clearOnClick) {
            return;
        }

        logger.debug("Installing click listener");

        comment.onClick.once(async () => {
            logger.info("Comment clicked", {
                id: comment.id
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
                count: String(clear.length)
            });

            for (const comment of clear) {
                comment.element.classList.remove(this.options.className);
            }

            // Transition class can't be removed before transition has finished
            await wait(this.options.transitionDurationSeconds * 1000 + 500);

            for (const comment of clear) {
                const className = `${ this.options.className }--transition`;
                comment.element.classList.remove(className);
            }
        });
    }

    public dispose(): void {
        logger.debug("Disposing comment highlighter");

        const elements = document.querySelectorAll(".Comment");

        logger.debug("Removing all highlights", {
            count: String(elements.length)
        });

        for (const element of elements) {
            element.classList.remove(this.options.className);
            element.classList.remove(`${ this.options.className }--transition`);
        }

        this.removeCss();
    }

    private addCss(): void {
        if (this.cssElement) {
            this.removeCss();
        }

        logger.info("Injecting CSS");

        const root = document.getElementById("2x-container");

        if (!root) {
            throw "Failed to inject CSS. Reason: 2x-container element not found.";
        }

        const element = root.firstElementChild;

        if (!element) {
            throw "Failed to inject CSS. Reason: 2x-container has no children.";
        }

        const style = element.getAttribute("style");
        let darkMode = false;

        logger.debug("Detecting whether dark mode is active");

        if (style) {
            const kvRegex = /--(\w+):#(\w+)/g;
            const matches: Record<string, string> = {};
            let kv: RegExpExecArray | null;

            while ((kv = kvRegex.exec(style)) !== null) {
                matches[ kv[ 1 ] ] = kv[ 2 ];
            }

            if (!Object.keys(matches).length) {
                logger.warn("Failed to detect whether dark mode is active, assuming false", {
                    reason: `Failed to parse style attribute '${ style }'`
                });
            } else if (!matches.background) {
                logger.warn("Failed to detect whether dark mode is active, assuming false", {
                    reason: `Background property missing from style attribute '${ style }'`
                });
            } else {
                const color = hexToRgb(matches.background);
                const luma = relativeLuminance(color);
                darkMode = luma < 0.5;

                logger.debug("Successfully detected if dark mode is active", { darkMode: String(darkMode) });
            }
        } else {
            logger.warn("Failed to detect whether dark mode is active", {
                reason: "2x-container child has no style"
            });
        }

        this.cssElement = injectCSS(this.getCSS(darkMode), document.head);

        logger.debug("Installing style observer");

        if (this.darkModeObserver == null) {
            this.darkModeObserver = new MutationObserver(this.onStyleChange);
        }

        this.darkModeObserver.observe(element, {
            attributes: true,
            attributeFilter: [ "style" ]
        });

        logger.info('Successfully injected CSS');
    }

    private removeCss(): void {
        logger.info("Removing CSS");

        if (!this.cssElement) {
            logger.info("No CSS to remove");

            return;
        }

        logger.debug("Uninstalling style observer");

        if (this.darkModeObserver !== null) {
            this.darkModeObserver.disconnect();
        }

        const removed = document.head.removeChild(this.cssElement);
        this.cssElement = null;

        if (removed) {
            logger.info("Successfully removed CSS");
        } else {
            logger.warn("No CSS was removed");
        }
    }

    private getCSS(darkMode: boolean): string {
        logger.debug("Generating CSS");

        if (this.options.customCSS) {
            logger.debug("Using custom CSS");

            return this.options.customCSS;
        }

        let css = `
            .Comment.${ this.options.className }--transition [data-testid="comment"] {
                transition-property: margin, padding, border, background-color, color;
                transition-duration: ${ this.options.transitionDurationSeconds }s;
            }

            .Comment.${ this.options.className } [data-testid="comment"] {
                margin-top: 4px;
                padding: 4px 10px;
                border: ${ this.options.border || '0' };
                border-radius: 4px;
                background-color: ${ darkMode ? this.options.backgroundColorDark : this.options.backgroundColor };
                color: ${ darkMode ? this.options.normalTextColorDark : this.options.normalTextColor };
            }
        `;

        if (this.options.linkTextColor && this.options.linkTextColorDark) {
            css += `
                .Comment.${ this.options.className } [data-testid="comment"] a {
                    color: ${ darkMode ? this.options.linkTextColorDark : this.options.linkTextColor };
                }
            `;
        }

        if (this.options.quoteTextColor && this.options.quoteTextColorDark) {
            css += `
                .Comment.${ this.options.className } [data-test-id="comment"] blockquote {
                    color: ${ darkMode ? this.options.quoteTextColorDark : this.options.quoteTextColor };
                }
            `;
        }

        logger.debug("Successfully generated CSS");

        return css;
    }

    @bind
    private onStyleChange(): void {
        logger.warn("Style change detected");

        this.removeCss();
        this.addCss();
    }
}
