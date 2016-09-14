
function errorHandler(error) {
	console.log('Error: ', error);
}

function getCurrentTimestamp() {
	return Math.floor(Date.now() / 1000);
}

var storage;
var options;
var threads;

storage = (function() {
	return {
		clear: clear,
		get: get,
		set: set,
		getMaxItems: getMaxItems,
		getMaxBytes: getMaxBytes
	};

	function getMaxItems() {
		return chrome.storage.sync.MAX_ITEMS - 1;
	}

	function getMaxBytes() {
		return chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 20;
	}

	function clear() {
		return new Promise(function(resolve, reject) {
			chrome.storage.sync.clear(function() {
				var error = chrome.runtime.lastError;

				if (error) {
					return reject();
				}

				options.refresh().then(function() {
					resolve();
				});

				threads.refresh();
			});
		});
	}

	function get(key) {
		return new Promise(function(resolve, reject) {
			chrome.storage.sync.get(key, function(data) {
				var error = chrome.runtime.lastError;

				if (error) {
					reject();
				} else {
					resolve(data[key]);
				}
			});
		});
	}

	function set(key, value) {
		var obj = {};
		obj[key] = value;

		return new Promise(function(resolve, reject) {
			chrome.storage.sync.set(obj, function() {
				var error = chrome.runtime.lastError;

				if (error) {
					reject();
				} else {
					resolve();
				}
			});
		});
	}
})();

options = (function() {
	var storageKey = 'reddit_au_options';
	var options = {};

	refresh();

	return {
		refresh: refresh,
		save: save,
		getAll: getAll,
		getBorder: getBorder,
		getHasBorder: getHasBorder,
		getBackColor: getBackColor,
		getFrontColor: getFrontColor,
		getUseCustomCSS: getUseCustomCSS,
		getCustomCSS: getCustomCSS,
		getThreadRemovalTimeSecs: getThreadRemovalTimeSecs,
		clear: clear
	};

	function refresh() {
		return new Promise(function(resolve) {
			storage.get(storageKey).then(function(data) {
				options = data || {};

				resolve();
			}).catch(errorHandler);
		});
	}

	function getAll() {
		return {
			border: getBorder(),
			hasBorder: getHasBorder(),
			backColor: getBackColor(),
			frontColor: getFrontColor(),
			useCustomCSS: getUseCustomCSS(),
			customCSS: getCustomCSS(),
			threadRemovalTimeSeconds: getThreadRemovalTimeSecs()
		};
	}

	function getBorder() {
		return getHasBorder() ? '1px dotted #CCCCCC' : '0';
	}

	function getHasBorder() {
		return options.border === undefined ? true : options.border;
	}

	function getBackColor() {
		return options.backColor || '#FFFDCC';
	}

	function getFrontColor() {
		return options.frontColor || '#000000';
	}

	function getUseCustomCSS() {
		return options.useCustomCSS || false;
	}

	function getCustomCSS() {
		return options.customCSS || '';
	}

	function getThreadRemovalTimeSecs() {
		return options.threadRemovalTimeSeconds || 604800;
	}

	function save(opts) {
		options = opts;
		return storage.set(storageKey, options).catch(errorHandler);
	}

	function clear() {
		return save({});
	}
})();

threads = (function() {
	var storageKey = 'reddit_au_threads';
	var collection = [];

	refresh();

	return {
		refresh: refresh,
		getById: getById,
		add: add
	};

	function refresh() {
		return new Promise(function(resolve) {
			storage.get(storageKey).then(function(data) {
				collection = data || [];

				resolve();
			}).catch(errorHandler);
		});
	}

	function getById(id) {
		var i = getIndex(id);

		if (i > -1) {
			return collection[getIndex(id)];
		}

		return null;
	}

	function getIndex(id) {
		for (var i = 0; i < collection.length; i++) {
			var thread = collection[i];

			if (id === thread.id) {
				return i;
			}
		}

		return -1;
	}

	function getOldest() {
		return collection[0];
	}

	function add(id) {
		cleanup();
		remove(id);
		collection.push({
			id: id,
			timestamp: getCurrentTimestamp()
		});

		storage.set(storageKey, collection).catch(errorHandler);
	}

	function cleanup() {
		if (!collection.length) {
			return;
		}

		while (isOverMaxItemsLimit() || isOverMaxThreadAgeLimit() || isOverMaxByteLimit()) {
			remove(getOldest().id);
		}
	}

	function remove(id) {
		var i = getIndex(id);

		if (i > -1) {
			collection.splice(i, 1);
		}
	}

	function isOverMaxItemsLimit() {
		return collection.length >= storage.getMaxItems();
	}

	function isOverMaxThreadAgeLimit() {
		return getOldest().timestamp < (getCurrentTimestamp() - options.getThreadRemovalTimeSecs());
	}

	function isOverMaxByteLimit() {
		// Assume every character is two bytes
		return JSON.stringify(collection).length * 2 >= storage.getMaxBytes();
	}
})();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.method) {
		case 'threads.getById':
			sendResponse(threads.getById(request.id));
			break;
		case 'threads.add':
			threads.add(request.id);
			break;
		case 'options.getAll':
			sendResponse(options.getAll());
			break;
		default:
			break;
	}
});

chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason === 'update') {
		if (details.version === chrome.app.getDetails().version) {
			return;
		}

		// Update stored options if outdated
		storage.get('reddit_au_options').then(function(opts) {
			options.clear().then(function() {
				options.save({
					backColor: opts.color || opts.backColor,
					frontColor: opts.front_color || opts.frontColor,
					threadRemovalTimeSeconds: opts.thread_removal_time_seconds || opts.threadRemovalTimeSeconds,
					border: opts.has_border || opts.border,
					useCustomCSS: opts.useCustomCSS,
					customCSS: opts.customCSS
				});
			});
		});
	}
});
