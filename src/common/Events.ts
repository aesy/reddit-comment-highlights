import { Event } from "event/Event";
import { BrowserExtensionEvent } from "event/BrowserExtensionEvent";

export const onThreadVisitedEvent: Event<string> = new BrowserExtensionEvent("onThreadVisitedEvent");
export const onOptionsChanged: Event<void> = new BrowserExtensionEvent("onOptionsChanged");
