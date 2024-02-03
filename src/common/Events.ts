import browser from "webextension-polyfill";
import { Event } from "@/event/Event";
import { BrowserExtensionEvent } from "@/event/BrowserExtensionEvent";
import { type Options } from "@/options/ExtensionOptions";

export const onThreadVisitedEvent: Event<string> = new BrowserExtensionEvent(
    "onThreadVisitedEvent",
    browser,
);

export const onOptionsChanged: Event<Options> = new BrowserExtensionEvent(
    "onOptionsChanged",
    browser,
);
