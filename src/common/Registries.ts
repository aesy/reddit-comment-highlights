import browser from "webextension-polyfill";
import { type FunctionRegistry } from "@/registry/FunctionRegistry";
import { BrowserExtensionFunctionRegistry } from "@/registry/BrowserExtensionFunctionRegistry";

export const extensionFunctionRegistry: FunctionRegistry =
    new BrowserExtensionFunctionRegistry(browser);
