/*
 * Copyright 2015 Daniel Watson <daniel+highlighter@staticfish.com>
 *
 * Please be a pal, and share or modify with attribution.
 * Source code can be obtained at <http://www.github.com/staticfish/>.
 */

var get_current_timestamp = function() {
	return new Date().getTime();
};

var storage = (function() {
    var get_max_items = function() {
        return chrome.storage.sync.MAX_ITEMS - 1;
    };

    var get_max_bytes = function() {
        return chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 20;
    };

    var clear = function() {
        chrome.storage.sync.clear();
    };

    var get = function(key) {
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get(key, function(data) {
                resolve(data[key]);
            });
        });
    };

    var set = function(key, value) {
        var obj = {};
        obj[key] = value;

        return new Promise(function(resolve, reject) {
            chrome.storage.sync.set(obj, function() {
                resolve();
            });
        });
    };

    return {
        clear: clear,
        get: get,
        set: set,
        get_max_items: get_max_items,
        get_max_bytes: get_max_bytes
    };
})();

var options = (function() {
    var storage_key = "reddit_au_options";
    var options = {};

    (function constructor() {
        storage.get(storage_key).then(function(data) {
            options = data || {};
        });
    })();

    var get_all = function() {
        return {
            border: get_border(),
            has_border: get_has_border(),
            color: get_color(),
            threadRemovalTimeSeconds: get_thread_removal_time_secs()
        };
    };

    var get_border = function() {
        return get_has_border() ? "1px dotted #CCCCCC" : "";
    };

    var get_has_border = function() {
        return options.border !== undefined ? options.border : true;
    };

    var get_color = function() {
        return options.color || "#FFFDCC";
    };

    var get_thread_removal_time_secs = function() {
        return options.threadRemovalTimeSeconds || 604800;
    };

    var save = function(opts) {
        options = opts;
        storage.set(storage_key, options);
    };

    return {
        save: save,
        get_all: get_all,
        get_border: get_border,
        get_has_border: get_has_border,
        get_color: get_color,
        get_thread_removal_time_secs: get_thread_removal_time_secs
    };
})();

var threads = (function() {
	var storage_key = "reddit_au_threads";
    var collection  = {};

    (function constructor() {
        storage.get(storage_key).then(function(data) {
            collection = data || {};
        });
	})();

    var get_by_id = function(id) {
        return {
            id: id,
            timestamp: collection[id]
        }
    };

	var get_oldest = function() {
        return {
            id: Object.keys(collection)[0],
            timestamp: 0
        };
	};

	var add = function(id) {
        cleanup();
        remove(id);
        collection[id] = get_current_timestamp();

		storage.set(storage_key, collection);
	};

    var get_length = function() {
        return Object.keys(collection).length;
    };

    var cleanup = function() {
        var num_objects = get_length();
        if (!num_objects)
            return;

        while (over_max_items_limit() || over_max_thread_age_limit() || over_max_byte_limit()) {
            remove(get_oldest().id);
        }
    };

    var remove = function(id) {
        delete collection[id];
    };

    var over_max_items_limit = function() {
        return get_length() >= storage.get_max_items();
    };

    var over_max_thread_age_limit = function() {
        return get_oldest().timestamp
            < (get_current_timestamp() - options.get_thread_removal_time_secs() || 432000);
    };

    var over_max_byte_limit = function() {
        // Assume every character is two bytes
        return JSON.stringify(collection).length * 2 >= storage.get_max_bytes();
    };

    return {
        get_by_id: get_by_id,
        add: add
    };
})();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "threads.get_by_id")
        sendResponse(threads.get_by_id(request.id));
    else if (request.method == "threads.add")
        threads.add(request.id);
    else if (request.method == "options.get_all")
        sendResponse(options.get_all());
});