import bind from "bind-decorator";
import { Subscribable } from "event/Event";
import { SyncEvent } from "event/SyncEvent";
import { isACommentThread, isMobileSite, RedditComment, RedditCommentThread, RedditPage } from "reddit/RedditPage";
import { Logging } from "logger/Logging";
import { RedesignRedditPage } from "reddit/RedesignRedditPage";
import { findClosestParent } from "util/DOM";

const logger = Logging.getLogger("OldRedditCommentPage");

class OldRedditComment implements RedditComment {
    private readonly _onClick = new SyncEvent<void>();
    private readonly _id: string | null;
    private readonly _author: string | null;
    private readonly _time: Date | null;

    public constructor(
        public readonly element: Element,
        // We need a reference to the thread to be able to fetch child comments...
        private readonly thread: RedditCommentThread
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

        this._id = this.element.getAttribute("data-fullname") || null;
        this._author = this.element.getAttribute("data-author") || null;
        this._time = OldRedditComment.getTime(element);
    }

    public get onClick(): Subscribable<void> {
        return this._onClick;
    }

    public get id(): string {
        if (!this._id) {
            throw "Deleted comments have no id";
        }

        return this._id;
    }

    public get author(): string {
        if (!this._author) {
            throw "Deleted comments have no author";
        }

        return this._author;
    }

    public get time(): Date {
        if (!this._time) {
            throw "Deleted comments have no time";
        }

        return this._time;
    }

    public isDeleted(): boolean {
        return !this._id || !this._author || !this._time;
    }

    public getChildComments(): RedditComment[] {
        // Avoid use of :scope psuedo selector for compatibility reasons (firefox mobile)
        const childElements = this.element.querySelectorAll(`.child > .listing > .comment`);

        return Array.from(childElements)
            .map(element => {
                const id = element.getAttribute("data-fullname");

                if (!id) {
                    return null;
                }

                return this.thread.getCommentById(id);
            })
            .filter(Boolean)
            .map(comment => comment!);
    }

    public dispose(): void {
        this._onClick.dispose();
        this.element.removeEventListener("click", this.onElementClick);
    }

    @bind
    private onElementClick(event: Event): void {
        const target = event.target as Node | null;

        if (!target) {
            return;
        }

        const comment = findClosestParent(target, ".comment");

        if (this.element === comment) {
            logger.debug("Comment clicked", { id: this.id || "null" });
            this._onClick.dispatch();
        }
    }

    private static getTime(element: Element): Date | null {
        const timeTag = element.getElementsByTagName("time")[ 0 ];

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
}

class OldRedditCommentThread implements RedditCommentThread {
    private readonly _onCommentAdded = new SyncEvent<RedditComment>();
    private readonly onChangeObserver: MutationObserver;
    private readonly comments: Map<string, RedditComment> = new Map();

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

    public getCommentById(): RedditComment | null {
        return this.comments.get(this.id) || null;
    }

    public getAllComments(): RedditComment[] {
        return Array.from(this.comments.values());
    }

    public dispose(): void {
        this._onCommentAdded.dispose();
        this.onChangeObserver.disconnect();
        this.comments.forEach(comment => comment.dispose());
        this.comments.clear();
    }

    private initialize(): void {
        const root = document.querySelector(".sitetable.nestedlisting");

        if (!root) {
            return;
        }

        logger.debug("Thread opened", { id: this.id });

        this.onChangeObserver.observe(root, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true
        });

        const notify = (comment: RedditComment): void => {
            const comments = comment.getChildComments();

            for (const comment of comments) {
                notify(comment);
            }

            this._onCommentAdded.dispatch(comment);
        };

        Array.from(root.getElementsByClassName("comment"))
            .map(element => new OldRedditComment(element, this))
            .forEach(comment => {
                if (!comment.isDeleted()) {
                    this.comments.set(comment.id, comment);
                    notify(comment);
                }
            });
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
                const comment = new OldRedditComment(element, this);

                if (!comment.isDeleted()) {
                    this.comments.set(comment.id, comment);
                    this._onCommentAdded.dispatch(comment);
                }
            });
    }
}

export class OldRedditPage implements RedditPage {
    private readonly _onThreadOpened = new SyncEvent<RedditCommentThread>();
    private commentThread: RedditCommentThread | null = null;

    public constructor() {
        this.initialize();
    }

    public get onThreadOpened(): Subscribable<RedditCommentThread> {
        if (!isACommentThread()) {
            return this._onThreadOpened;
        }

        const self = this;

        return {
            listener(): MethodDecorator {
                return self._onThreadOpened.listener();
            },
            once(listener: (data: RedditCommentThread) => void): Subscribable<RedditCommentThread> {
                self._onThreadOpened.once(listener);

                if (self.commentThread) {
                    listener(self.commentThread);
                }

                return this;
            },
            subscribe(listener: (data: RedditCommentThread) => void): Subscribable<RedditCommentThread> {
                self._onThreadOpened.subscribe(listener);

                if (self.commentThread) {
                    listener(self.commentThread);
                }

                return this;
            },
            unsubscribe(listener: (data: RedditCommentThread) => void): Subscribable<RedditCommentThread> {
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
            // No one logged in
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

        if (this.commentThread) {
            this.commentThread.dispose();
        }
    }

    public static isSupported(): boolean {
        return !RedesignRedditPage.isSupported() && !isMobileSite();
    }

    private initialize(): void {
        this.commentThread = new OldRedditCommentThread();

        this._onThreadOpened.dispatch(this.commentThread);
    }
}
