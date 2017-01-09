import ExtensionOptions from './storage/ExtensionOptions';
import ThreadStorage from './storage/ThreadStorage';
import ChromeStorage from './storage/ChromeStorage';

/* this file should really be called 'eventScript' as it's only loaded when needed */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

chrome.runtime.onInstalled.addListener(details => {
	if (details.reason === 'update') {
		if (details.version === chrome.app.getDetails().version) {
			return;
		}

		// update stored options if outdated
		ChromeStorage.get('reddit_au_options').then(opts => {
			ExtensionOptions.clear().then(() => {
				opts = opts || {};

				ExtensionOptions
					.setBackgroundColor(opts.color || opts.backColor)
					.setTextColor(opts.front_color || opts.frontColor)
					.setThreadRemovalSeconds(opts.thread_removal_time_seconds || opts.threadRemovalTimeSeconds)
					.setBorder(opts.has_border || opts.border)
					.setClearComment(opts.clearCommentOnClick, opts.clearCommentincludeChildren)
					.setCustomCSS(opts.customCSS)
					.setCustomCSSClassName(opts.customCSSClassName)
					.setRedirect(opts.redirect)
					.save();
			});
		});
	}
});

// this is necessary to expose the classes for when the ContentScript gets the 'window' object of the background page
// via 'chrome.extension.getBackgroundPage()'
export {
	ExtensionOptions,
	ThreadStorage,
	ChromeStorage
};
