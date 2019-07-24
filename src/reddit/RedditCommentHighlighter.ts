import { RedditComment } from "reddit/RedditPage";

export interface RedditCommentHighlighter {
    highlightComment(comment: RedditComment): void;
    dispose(): void;
}
