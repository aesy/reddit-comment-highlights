import ExtensionOptions from './ExtensionOptions';
import ThreadStorage from './ThreadStorage';
import ChromeStorage from './ChromeStorage';

/* this file should really be called 'EventScript' as it's only loaded when needed */

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
					.setCustomCSS(opts.customCSS)
					.setCustomCSSClassName(opts.customCSSClassName)
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
