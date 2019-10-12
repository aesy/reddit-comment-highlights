import { FunctionRegistry } from "registry/FunctionRegistry";
import { RemoteFunctionBrowserExtensionRegistry } from "registry/RemoteFunctionBrowserExtensionRegistry";
import { getBrowser } from "util/WebExtensions";

const browser = getBrowser();

export const extensionFunctionRegistry: FunctionRegistry = new RemoteFunctionBrowserExtensionRegistry(browser);
