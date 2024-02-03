import { expect } from "chai";
import { instance, mock, when } from "@typestrong/ts-mockito";
import { type Subscribable } from "@/event/Event";
import { type RedditComment } from "@/reddit/RedditPage";
import { OldRedditCommentHighlighter } from "@/reddit/OldRedditCommentHighlighter";

describe("OldRedditCommentHighlighter", () => {
    const options = {
        backgroundColor: "orange",
        backgroundColorDark: "purple",
        border: "1px solid red",
        className: "highlight",
        clearOnClick: false,
        customCSS: null,
        includeChildren: false,
        linkTextColor: null,
        linkTextColorDark: null,
        normalTextColor: "green",
        normalTextColorDark: "blue",
        quoteTextColor: null,
        quoteTextColorDark: null,
        transitionDurationSeconds: 2,
    };

    it("should inject css", async () => {
        const count = document.head.querySelectorAll("style").length;

        const ignored = new OldRedditCommentHighlighter(options);

        expect(document.head.querySelectorAll("style")).to.have.length(
            count + 1,
        );
    });

    it("should remove css on disposal", async () => {
        const highlighter = new OldRedditCommentHighlighter(options);
        const count = document.head.querySelectorAll("style").length;

        highlighter.dispose();

        expect(document.head.querySelectorAll("style")).to.have.length(
            count - 1,
        );
    });

    it("should add classname to comment element", async () => {
        const highlighter = new OldRedditCommentHighlighter(options);
        const comment = mock<RedditComment>();
        const subscribable = mock<Subscribable<void>>();
        const element = document.createElement("div");

        when(comment.getChildComments()).thenReturn([]);
        when(comment.onClick).thenReturn(subscribable);
        when(comment.element).thenReturn(element);
        when(comment.time).thenReturn(new Date());

        highlighter.highlightComment(instance(comment));

        expect(element.classList.contains(options.className)).to.equal(true);
    });
});
