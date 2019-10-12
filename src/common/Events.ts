import { Event } from "event/Event";
import { BrowserExtensionEvent } from "event/BrowserExtensionEvent";
import { getBrowser } from "util/WebExtensions";

const browser = getBrowser();

export const onThreadVisitedEvent: Event<string> = new BrowserExtensionEvent(browser, "onThreadVisitedEvent");
export const onSettingsChanged: Event<void> = new BrowserExtensionEvent(browser, "onSettingsChanged");
