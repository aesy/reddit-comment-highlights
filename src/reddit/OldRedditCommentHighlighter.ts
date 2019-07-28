import { HighlighterOptions, RedditCommentHighlighter } from "reddit/RedditCommentHighlighter";
import { RedditComment } from "reddit/RedditPage";
import { injectCSS } from "util/DOM";

export class OldRedditCommentHighlighter implements RedditCommentHighlighter {
    private readonly cssElement: Element;

    public constructor(
        private readonly options: HighlighterOptions
    ) {
        this.cssElement = injectCSS(this.getCSS(), document.head);
    }

    public highlightComment(comment: RedditComment): void {
        comment.element.classList.add(this.options.className);
        comment.element.classList.add(`${ this.options.className }--transition`);

        if (!this.options.clearOnClick) {
            return;
        }

        // Comments to clear on click
        const clear: RedditComment[] = [];

        if (this.options.includeChildren) {
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
                comment.element.classList.remove(this.options.className);

                window.setTimeout((): void => {
                    // Transition class can't be removed before transition has finished
                    const className = `${ this.options.className }--transition`;
                    comment.element.classList.remove(className);
                }, this.options.transitionDurationSeconds * 1000 + 500);
            }
        });
    }

    public dispose() {
        document.head.removeChild(this.cssElement);

        for (const element of document.querySelectorAll(".comment")) {
            element.classList.remove(this.options.className);
            element.classList.remove(`${ this.options.className }--transition`);
        }
    }

    private getCSS(): string {
        if (this.options.customCSS) {
            return this.options.customCSS;
        }

        let css = `
            .comment.${ this.options.className }--transition  > .entry .md {
                transition-property: padding, border, background-color, color;
                transition-duration: ${ this.options.transitionDurationSeconds }s;
            }

            .comment.${ this.options.className } > .entry .md {
                padding: 2px;
                border: ${ this.options.border || "0" };
                border-radius: 2px;
                background-color: ${ this.options.backgroundColor };
                color: ${ this.options.normalTextColor };
            }
        `;

        if (this.options.linkTextColor) {
            css += `
                .comment.${ this.options.className } > .entry .md a {
                    color: ${ this.options.linkTextColor }
                }
            `;
        }

        if (this.options.quoteTextColor !== null) {
            css += `
                .comment.${ this.options.className } > .entry .md blockquote {
                    color: ${ this.options.quoteTextColor }
                }
            `;
        }

        css += `
            .res-nightmode .comment.${ this.options.className } > .entry .md {
                padding: 2px;
                border: ${ this.options.border || "0" };
                border-radius: 2px;
                background-color: ${ this.options.backgroundColorDark };
                color: ${ this.options.normalTextColorDark }
            }
        `;

        if (this.options.linkTextColorDark) {
            css += `
                .res-nightmode .comment.${ this.options.className } > .entry .md a {
                    color: ${ this.options.linkTextColorDark }
                }
            `;
        }

        if (this.options.quoteTextColorDark) {
            css += `
                .res-nightmode .comment.${ this.options.className } > .entry .md blockquote {
                    color: ${ this.options.quoteTextColorDark }
                }
            `;
        }

        return css;
    }
}
