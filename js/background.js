/*
 * Copyright 2015 Daniel Watson <daniel+highlighter@staticfish.com>
 *
 * Please be a pal, and share or modify with attribution.
 * Source code can be obtained at <http://www.github.com/staticfish/>.
 */

var reddit_au = {
	maximumSavedThreadHeap: 490,

	init: function() {
		var self = this;

		self.get_options(function(opts) {
			self.process(opts);
		});
	},

	process: function(opts) {
		var self = this;

		var id = self.get_thread_id();

		if (id) {
			chrome.storage.sync.get("reddit_au_threads", function(threads) {
				threads = threads.reddit_au_threads || {};
				var lastThreadVisitEpoch = threads[id];

				if (lastThreadVisitEpoch)
					self.highlight_comments(lastThreadVisitEpoch, opts);

				self.add_thread(id, function() {
					self.clean_up_threads(opts);
				});
			});
		}
	},

	add_thread: function(id, callback){
		var self = this;

		chrome.storage.sync.get("reddit_au_threads", function(threads) {
			threads = threads.reddit_au_threads || {};
			threads[id] = self.get_timestamp();

			chrome.storage.sync.set({"reddit_au_threads": threads}, function() {
				if (callback)
					callback();
			});
		});

	},

	get_options: function(callback) {
		chrome.storage.sync.get("reddit_au_options", function(opts) {
			opts = opts.reddit_au_options || {};
			callback(opts);
		});
	},

	get_thread_id: function() {
		var firstSiteTable = $("#siteTable").first();
		if (!firstSiteTable)
			return null;

		var threadIDParts = $(firstSiteTable).children(":first").attr("data-fullname");
		if (!threadIDParts)
			return null;
		else
			return threadIDParts.split("_")[1];
	},

	highlight_comments: function(lastThreadVisitEpoch, opts) {
		$(".tagline").each(function(index, commentTagline) {

			// Reddit comment date format: 2014-02-20T00:41:27+00:00
			var commentDateString = $(commentTagline).find("time").attr("datetime");
			if (!commentDateString)
				return;

			var commentDateEpoch = Date.parse(commentDateString);

			if (commentDateEpoch >= lastThreadVisitEpoch) {
				$(commentTagline).next().find(".md").css("background-color", opts.color || "#FFFDCC");
				$(commentTagline).next().find(".md").css("padding", "2px");
				$(commentTagline).next().find(".md").css("border-radius", "2px");

				if (opts.border || opts.border === undefined)
					$(commentTagline).next().find(".md").css("border", "1px dotted #CCCCCC");
			}
		});
	},

	clean_up_threads: function(opts) {
		var self = this;

		chrome.storage.sync.get("reddit_au_threads", function(threads) {
			threads = threads.reddit_au_threads || {};
			var allKeys = Object.keys(threads);

			// If we have more than 490 keys stored, then we have very low space (limit is 512 for chrome sync)
			if (allKeys.length > self.maximumSavedThreadHeap) {

				$.each(threads, function(key, savedDate) {
					if (savedDate < (self.get_timestamp() - opts.threadRemovalTimeSeconds || 432000))
						delete threads[key];
				});

				chrome.storage.sync.set({"reddit_au_threads": threads});
			}
		});
	},

	get_timestamp: function() {
		return new Date().getTime();
	}
}

reddit_au.init();