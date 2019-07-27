import bind from "bind-decorator";
import { Subscribable, Event as PubSubEvent } from "event/Event";
import { RedditComment, RedditCommentThread, RedditPage } from "reddit/RedditPage";
import { findClosestParent } from "util/DOM";

class OldRedditComment implements RedditComment {
    private readonly _onClick: PubSubEvent<void> = new PubSubEvent();

    public constructor(
        public readonly element: Element
    ) {
        element.addEventListener(
            "click",
            this.onElementClick,
            {
                capture: false,
                once: false,
                passive: true
            }
        );
    }

    public get onClick(): Subscribable<void> {
        return this._onClick;
    }

    public get id(): string {
        const id = this.element.getAttribute("data-fullname");

        if (!id) {
            throw "Failed to read thread id. Reason: data-fullname attribute is missing on comment element";
        }

        return id;
    }

    public get author(): string | null {
        return this.element.getAttribute("data-author") || null;
    }

    public get time(): Date | null {
        const timeTag = this.element.getElementsByTagName("time")[ 0 ];

        if (!timeTag) {
            // Comment deleted
            return null;
        }

        // Reddit comment date format: 2014-02-20T00:41:27+00:00
        const commentDate = timeTag.getAttribute("datetime");

        if (!commentDate) {
            return null;
        }

        return new Date(commentDate);
    }

    public getChildComments(): RedditComment[] {
        return Array.from(
            // Avoid use of :scope psuedo selector for compatibility reasons (firefox mobile)
            this.element.querySelectorAll(`#thing_${ this.id } > .child > .listing > .comment`)
        ).map((a): OldRedditComment => new OldRedditComment(a));
    }

    public dispose(): void {
        this._onClick.dispose();
        this.element.removeEventListener("click", this.onElementClick);
    }

    @bind
    private onElementClick(event: Event) {
        const target = event.target as Node | null;

        if (!target) {
            return;
        }

        const comment = findClosestParent(target, ".comment");

        if (this.element === comment) {
            this._onClick.dispatch();
        }
    }
}

class OldRedditCommentThread implements RedditCommentThread {
    private readonly _onCommentAdded: PubSubEvent<RedditComment> = new PubSubEvent();
    private readonly onChangeObserver: MutationObserver;

    public constructor() {
        this.onChangeObserver = new MutationObserver(this.onChange);

        this.initialize();
    }

    public get onCommentAdded(): Subscribable<RedditComment> {
        return this._onCommentAdded;
    }

    public get id(): string {
        // Get the path of the thread (works on mobile, too)
        const pathPieces = document.location.pathname.split("/");

        // The 4th item in the path *should* always be the thread id
        return pathPieces[ 4 ];
    }

    public isAtRootLevel(): boolean {
        const pathPieces = document.location.pathname.split("/");

        // Check so that url is in the form of '/r/<subreddit>/comments/...
        const correctPathFormat = pathPieces[ 1 ] === "r" && pathPieces[ 3 ] === "comments";

        if (!correctPathFormat) {
            return false;
        }

        // Check so that url doesn't include direct link to comment
        return pathPieces.length < 8;
    }

    public getCommentById(id: string): RedditComment {
        throw "Not Implemented";
    }

    public getAllComments(): RedditComment[] {
        const root: Element | null = document.querySelector(".sitetable.nestedlisting");

        if (!root) {
            return [];
        }

        const comments: Element[] = Array.from(root.getElementsByClassName("comment"));

        return comments.map(element => new OldRedditComment(element));
    }

    public dispose(): void {
        this._onCommentAdded.dispose();
        this.onChangeObserver.disconnect();
    }

    private initialize(): void {
        const root = document.querySelector(".sitetable.nestedlisting");

        if (!root) {
            return;
        }

        this.onChangeObserver.observe(root, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true
        });

        const notify = (comment: RedditComment) => {
            const comments = comment.getChildComments();

            for (const comment of comments) {
                notify(comment);
            }

            this._onCommentAdded.dispatch(comment);
        };

        const comments = this.getAllComments();

        for (const comment of comments) {
            notify(comment);
        }
    }

    @bind
    private onChange(changes: MutationRecord[]): void {
        changes
            .filter((record: MutationRecord): boolean => {
                // Filter out anything that's not a sitetable sibling
                return (record.target as Element).classList.contains("sitetable");
            })
            .reduce((accumulator: Element[], record: MutationRecord): Element[] => {
                const nodes = Array.from(record.addedNodes);

                return accumulator.concat(nodes as Element[]);
            }, [])
            .filter((element: Element): boolean => {
                // Filter out anything that's not a comment
                return element.classList.contains("comment");
            })
            .forEach((element: Element): void => {
                const comment = new OldRedditComment(element);

                this._onCommentAdded.dispatch(comment);
            });
    }
}

export class OldRedditPage implements RedditPage {
    private readonly _onThreadOpened: PubSubEvent<RedditCommentThread> = new PubSubEvent();
    private initialized: boolean = false;

    public get onThreadOpened(): Subscribable<RedditCommentThread> {
        if (!OldRedditPage.isACommentThread()) {
            return this._onThreadOpened;
        }

        const self = this;

        return {
            listener(): MethodDecorator {
                return self._onThreadOpened.listener();
            },
            once(listener: <T>(data: RedditCommentThread) => void): Subscribable<RedditCommentThread> {
                self._onThreadOpened.subscribe(listener);

                if (!self.initialized) {
                    self.initialize();
                    self.initialized = true;
                }

                return this;
            },
            subscribe(listener: <T>(data: RedditCommentThread) => void): Subscribable<RedditCommentThread> {
                self._onThreadOpened.subscribe(listener);

                if (!self.initialized) {
                    self.initialize();
                    self.initialized = true;
                }

                return this;
            },
            unsubscribe(listener: <T>(data: RedditCommentThread) => void): Subscribable<RedditCommentThread> {
                self._onThreadOpened.unsubscribe(listener);

                return this;
            }
        };
    }

    public getLoggedInUser(): string | null {
        const usernameElement = document.querySelector(".user a");

        if (usernameElement === null) {
            return null;
        }

        if (usernameElement.classList.contains("login-required")) {
            // Noone logged in
            return null;
        }

        const username = usernameElement.textContent;

        if (!username) {
            return null;
        }

        return username;
    }

    public dispose(): void {
        this._onThreadOpened.dispose();
    }

    public static isSupported(): boolean {
        return !OldRedditPage.isMobileSite();
    }

    private static isMobileSite(): boolean {
        return document.location.hostname === "m.reddit.com";
    }

    private static isACommentThread(): boolean {
        const pathPieces = document.location.pathname.split("/");

        // Check if url is in the form of '/r/<subreddit>/comments/...'
        return pathPieces[ 1 ] === "r" && pathPieces[ 3 ] === "comments";
    }

    private initialize(): void {
        const commentThread = new OldRedditCommentThread();

        this._onThreadOpened.dispatch(commentThread);
    }
}
