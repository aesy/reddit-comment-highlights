import browser from "webextension-polyfill";
import { FunctionRegistry } from "registry/FunctionRegistry";
import { RemoteFunctionBrowserExtensionRegistry } from "registry/RemoteFunctionBrowserExtensionRegistry";

export const extensionFunctionRegistry: FunctionRegistry = new RemoteFunctionBrowserExtensionRegistry(browser);
