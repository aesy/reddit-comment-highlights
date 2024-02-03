import { type RedditComment } from "@/reddit/RedditPage";

export interface HighlighterOptions {
    className: string;
    clearOnClick: boolean;
    includeChildren: boolean;
    customCSS: string | null;
    transitionDurationSeconds: number;
    border: string | null;
    backgroundColor: string;
    normalTextColor: string;
    linkTextColor: string | null;
    quoteTextColor: string | null;
    backgroundColorDark: string;
    normalTextColorDark: string;
    linkTextColorDark: string | null;
    quoteTextColorDark: string | null;
}

export interface RedditCommentHighlighter {
    highlightComment(comment: RedditComment): void;
    dispose(): void;
}
