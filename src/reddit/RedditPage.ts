import { Subscribable } from "event/Event";

export interface RedditPage {
    readonly onThreadOpened: Subscribable<RedditCommentThread>;

    getLoggedInUser(): string | null;
    dispose(): void;
}

export interface RedditCommentThread {
    readonly onCommentAdded: Subscribable<RedditComment>;
    readonly id: string;

    isAtRootLevel(): boolean;
    getCommentById(id: string): RedditComment;
    getAllComments(): RedditComment[];
    dispose(): void;
}

export interface RedditComment {
    readonly element: Element;
    readonly onClick: Subscribable<void>;
    readonly id: string;
    readonly author: string | null;
    readonly time: Date | null;

    getChildComments(): RedditComment[];
    dispose(): void;
}
