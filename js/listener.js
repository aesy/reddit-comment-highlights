chrome.runtime.onInstalled.addListener(function(details) {
	// Clear storage (but keep settings) if extension is updated
	if (details.reason == "update")
		chrome.storage.sync.get("reddit_au_options", function(opts) {
			opts = opts.reddit_au_options || {};

			chrome.storage.sync.clear(function() {
				chrome.storage.sync.set({"reddit_au_options": opts});
			});
		});
});