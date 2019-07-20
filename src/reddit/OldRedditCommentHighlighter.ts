import { injectCSS } from "util/DOM";
import { Options } from "options/ExtensionOptions";
import { RedditComment } from "reddit/RedditPage";
import { RedditCommentHighlighter } from "reddit/RedditCommentHighlighter";

export class OldRedditCommentHighlighter implements RedditCommentHighlighter {
    private static readonly TRANSITION_DURATION_SECONDS: number = 0.4;

    public constructor(
        private readonly options: Options
    ) {
        injectCSS(this.getCSS(), document.head);
    }

    public highlightComment(comment: RedditComment): void {
        comment.element.classList.add(`${ this.options.customCSSClassName }--transition`);
        comment.element.classList.add(this.options.customCSSClassName);

        if (!this.options.clearCommentOnClick) {
            return;
        }

        // Comments to clear on click
        const clear: RedditComment[] = [];

        if (this.options.clearCommentincludeChildren) {
            const addComment = (comment: RedditComment) => {
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

        comment.onClick.once((): void => {
            for (const comment of clear) {
                comment.element.classList.remove(this.options.customCSSClassName);
                // TODO fix click listener on child comments are not removed

                // Can't be removed before transition has finished
                window.setTimeout((): void => {
                    const className = `${ this.options.customCSSClassName }--transition`;
                    comment.element.classList.remove(className);
                }, OldRedditCommentHighlighter.TRANSITION_DURATION_SECONDS * 1000 + 500);
            }
        });
    }

    private getCSS(): string {
        if (this.options.customCSS) {
            return this.options.customCSS;
        }

        let css = `
            .comment.${ this.options.customCSSClassName }--transition  > .entry .md {
                transition-property: padding, border, background-color, color;
                transition-duration: ${ OldRedditCommentHighlighter.TRANSITION_DURATION_SECONDS }s;
            }

            .comment.${ this.options.customCSSClassName } > .entry .md {
                padding: 2px;
                border: ${ this.options.border || "0" };
                border-radius: 2px;
                background-color: ${ this.options.backColor };
                color: ${ this.options.frontColor };
            }
        `;

        if (this.options.linkColor) {
            css += `
                .comment.${ this.options.customCSSClassName } > .entry .md a {
                    color: ${ this.options.linkColor }
                }
            `;
        }

        if (this.options.quoteTextColor !== null) {
            css += `
                .comment.${ this.options.customCSSClassName } > .entry .md blockquote {
                    color: ${ this.options.quoteTextColor }
                }
            `;
        }

        if (this.options.usesRES) {
            css += `
                .res-nightmode .comment.${ this.options.customCSSClassName } > .entry .md {
                    padding: 2px;
                    border: ${ this.options.border || "0" };
                    border-radius: 2px;
                    background-color: ${ this.options.backNightColor };
                    color: ${ this.options.frontNightColor }
                }
            `;

            if (this.options.linkNightColor) {
                css += `
                    .res-nightmode .comment.${ this.options.customCSSClassName } > .entry .md a {
                        color: ${ this.options.linkNightColor }
                    }
                `;
            }

            if (this.options.quoteTextNightColor) {
                css += `
                    .res-nightmode .comment.${ this.options.customCSSClassName } > .entry .md blockquote {
                        color: ${ this.options.quoteTextNightColor }
                    }
                `;
            }
        }

        return css;
    }
}
