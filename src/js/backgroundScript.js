import Extension from './browser/Extension';
import Storage from './browser/Storage';
import ExtensionOptions from './storage/ExtensionOptions';
import ThreadStorage from './storage/ThreadStorage';
import * as Utils from './utils';

/* This file should really be called 'eventScript' as it's only loaded when needed */

Extension.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.method) {
		case 'ThreadStorage.getById':
			sendResponse(ThreadStorage.getById(request.threadId));
			break;
		case 'ThreadStorage.add':
			ThreadStorage.add(request.threadId);
			ThreadStorage.save();
			break;
		case 'ExtensionOptions.getAll':
			sendResponse({
				redirect: ExtensionOptions.getRedirect(),
				className: ExtensionOptions.getCSSClassName(),
				css: ExtensionOptions.getCSS(),
				clearComment: ExtensionOptions.getClearComment()
			});
			break;
		default:
			break;
	}
});

Extension.runtime.onInstalled.addListener(details => {
	if (details.reason === 'update') {
		if (details.version === Extension.runtime.getManifest().version) {
			return;
		}

		// Update stored options if outdated
		Storage.get('reddit_au_options').then(opts => {
			ExtensionOptions.clear().then(() => {
				opts = opts || {};

				ExtensionOptions
					.setBackgroundColor(opts.color || opts.backColor)
					.setBackgroundNightColor(opts.backNightColor)
					.setTextColor(opts.front_color || opts.frontColor)
					.setTextNightColor(opts.frontNightColor)
					.setLinkColor(opts.linkColor)
					.setLinkNightColor(opts.linkNightColor)
					.setQuoteTextColor(opts.quoteTextColor)
					.setQuoteTextNightColor(opts.quoteTextNightColor)
					.setThreadRemovalSeconds(opts.thread_removal_time_seconds || opts.threadRemovalTimeSeconds)
					.setBorder(opts.has_border || opts.border)
					.setClearComment(opts.clearCommentOnClick, opts.clearCommentincludeChildren)
					.setCustomCSS(opts.customCSS)
					.setCustomCSSClassName(opts.customCSSClassName)
					.setRedirect(opts.redirect)
					.setIsResUser(opts.usesRES)
					.save();
			});
		});
	}
});

// This is necessary to expose the classes for when the content script gets the 'window' object of the background page
// via 'extension.getBackgroundPage()'
export {
	ExtensionOptions,
	ThreadStorage,
	Storage,
	Utils
};
