
function getCurrentTimestamp() {
	return Math.floor(new Date().getTime() / 1000);
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
		return new Promise(function(resolve) {
			chrome.storage.sync.clear(function() {
				options.refresh().then(function() {
					resolve();
				});

				threads.refresh();
			});
		});
	}

	function get(key) {
		return new Promise(function(resolve) {
			chrome.storage.sync.get(key, function(data) {
				resolve(data[key]);
			});
		});
	}

	function set(key, value) {
		var obj = {};
		obj[key] = value;

		return new Promise(function(resolve) {
			chrome.storage.sync.set(obj, function() {
				resolve();
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
		getThreadRemovalTimeSecs: getThreadRemovalTimeSecs
	};

	function refresh() {
		return new Promise(function(resolve) {
			storage.get(storageKey).then(function(data) {
				options = data || {};

				resolve();
			});
		});
	}

	function getAll() {
		return {
			border: getBorder(),
			hasBorder: getHasBorder(),
			backColor: getBackColor(),
			frontColor: getFrontColor(),
			threadRemovalTimeSeconds: getThreadRemovalTimeSecs()
		};
	}

	function getBorder() {
		return getHasBorder() ? '1px dotted #CCCCCC' : '';
	}

	function getHasBorder() {
		return options.border === undefined ? true : options.border;
	}

	function getBackColor() {
		return options.color || '#FFFDCC';
	}

	function getFrontColor() {
		return options.front_color || '#000000';
	}

	function getThreadRemovalTimeSecs() {
		return options.thread_removal_time_seconds || 604800;
	}

	function save(opts) {
		options = opts;
		return storage.set(storageKey, options);
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
			});
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
		for (var i in collection) {
			if (!Object.hasOwnProperty.call(collection, i)) {
				return;
			}

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

		storage.set(storageKey, collection);
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
		return collection.length >= storage.get_max_items();
	}

	function isOverMaxThreadAgeLimit() {
		return getOldest().timestamp < (getCurrentTimestamp() - options.getThreadRemovalTimeSecs());
	}

	function isOverMaxByteLimit() {
		// Assume every character is two bytes
		return JSON.stringify(collection).length * 2 >= storage.get_max_bytes();
	}
})();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.method) {
		case 'threads.get_by_id':
			sendResponse(threads.get_by_id(request.id));
			break;
		case 'threads.add':
			threads.add(request.id);
			break;
		case 'options.get_all':
			sendResponse(options.get_all());
			break;
		default:
			break;
	}
});

chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason === 'update') {
		var opts = options.get_all();

		storage.clear().then(function() {
			options.save(opts);
		});
	}
});
