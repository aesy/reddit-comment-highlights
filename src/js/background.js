import { Options } from './Options';
import { ThreadStorage } from './ThreadStorage';
import { Storage } from './Storage';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.method) {
		case 'threads.getById':
			sendResponse(ThreadStorage.getById(request.id));
			break;
		case 'threads.add':
			ThreadStorage.add(request.id);
			break;
		case 'options.getAll':
			sendResponse(Options.getAll());
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

		// Update stored options if outdated
		Storage.get('reddit_au_options').then(opts => {
			Options.clear().then(() => {
				Options.save({
					backColor: opts.color || opts.backColor,
					frontColor: opts.front_color || opts.frontColor,
					threadRemovalTimeSeconds: opts.thread_removal_time_seconds || opts.threadRemovalTimeSeconds,
					border: opts.has_border || opts.border,
					useCustomCSS: opts.useCustomCSS,
					customCSS: opts.customCSS,
					customCSSClassName: opts.customCSSClassName
				});
			});
		});
	}
});

export {
	Options,
	ThreadStorage,
	Storage
};
