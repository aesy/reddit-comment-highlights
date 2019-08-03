import "jsdom-global/register";
import { expect } from "chai";
import { Subscribable } from "event/Event";
import { RedditComment } from "reddit/RedditPage";
import { OldRedditCommentHighlighter } from "reddit/OldRedditCommentHighlighter";
import { instance, mock, when } from "ts-mockito";

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
        transitionDurationSeconds: 2
    };

    it("should inject css", async () => {
        const count = document.head.querySelectorAll("style").length;

        const ignored = new OldRedditCommentHighlighter(options);

        expect(document.head.querySelectorAll("style")).to.have.length(count + 1);
    });

    it("should remove css on disposal", async () => {
        const highlighter = new OldRedditCommentHighlighter(options);
        const count = document.head.querySelectorAll("style").length;

        highlighter.dispose();

        expect(document.head.querySelectorAll("style")).to.have.length(count - 1);
    });

    it("should remove highlights on disposal", async () => {
        const element = document.createElement("div");
        element.classList.add("comment", options.className);
        document.body.appendChild(element);

        new OldRedditCommentHighlighter(options).dispose();

        expect(element.classList.contains(options.className)).to.equal(false);
    });

    it("should add classname to comment element", async () => {
        const highlighter = new OldRedditCommentHighlighter(options);
        const comment = mock<RedditComment>();
        const subscribable = mock<Subscribable<void>>();
        const element = document.createElement("div");

        when(comment.getChildComments()).thenReturn([]);
        when(comment.onClick).thenReturn(subscribable);
        when(comment.element).thenReturn(element);

        highlighter.highlightComment(instance(comment));

        expect(element.classList.contains(options.className)).to.equal(true);
    });
});
