/*
 * Copyright 2015 Daniel Watson <daniel+highlighter@staticfish.com>
 *
 * Please be a pal, and share or modify with attribution.
 * Source code can be obtained at <http://www.github.com/staticfish/>.
 */

var get_current_timestamp = function() {
	return Math.floor(new Date().getTime() / 1000);
};

var storage = (function() {
    return {
        clear: clear,
        get: get,
        set: set,
        get_max_items: get_max_items,
        get_max_bytes: get_max_bytes
    };

    function get_max_items() {
        return chrome.storage.sync.MAX_ITEMS - 1;
    }

    function get_max_bytes() {
        return chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 20;
    }

    function clear() {
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.clear(function() {
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
                resolve(data[key]);
            });
        });
    }

    function set(key, value) {
        var obj = {};
        obj[key] = value;

        return new Promise(function(resolve, reject) {
            chrome.storage.sync.set(obj, function() {
                resolve();
            });
        });
    }
})();

var options = (function() {
    var storage_key = "reddit_au_options",
        options = {};

    refresh();

    return {
        refresh: refresh,
        save: save,
        get_all: get_all,
        get_border: get_border,
        get_has_border: get_has_border,
        get_color: get_color,
        get_thread_removal_time_secs: get_thread_removal_time_secs
    };

    function refresh() {
        return new Promise(function(resolve, reject) {
            storage.get(storage_key).then(function(data) {
                options = data || {};

                resolve();
            });
        });
    }

    function get_all() {
        return {
            border: get_border(),
            has_border: get_has_border(),
            color: get_color(),
            thread_removal_time_seconds: get_thread_removal_time_secs()
        };
    }

    function get_border() {
        return get_has_border() ? "1px dotted #CCCCCC" : "";
    }

    function get_has_border() {
        return options.border !== undefined ? options.border : true;
    }

    function get_color() {
        return options.color || "#FFFDCC";
    }

    function get_thread_removal_time_secs() {
        return options.thread_removal_time_seconds || 604800;
    }

    function save(opts) {
        options = opts;
        return storage.set(storage_key, options);
    }
})();

var threads = (function() {
	var storage_key = "reddit_au_threads",
        collection  = [];

    refresh();

    return {
        refresh: refresh,
        get_by_id: get_by_id,
        add: add
    };

    function refresh() {
        return new Promise(function(resolve, reject) {
            storage.get(storage_key).then(function(data) {
                collection = data || [];

                resolve();
            });
        });
    }

    function get_by_id(id) {
        var i = get_index(id);

        if (i > -1)
            return collection[get_index(id)];

        return null;
    }

    function get_index(id) {
        for (var i in collection) {
            var thread = collection[i];

            if (id == thread.id)
                return i;
        }

        return -1;
    }

	function get_oldest() {
        return collection[0];
	}

	function add(id) {
        cleanup();
        remove(id);
        collection.push({
            id: id,
            timestamp: get_current_timestamp()
        });

		storage.set(storage_key, collection);
	}

    function cleanup() {
        if (!collection.length)
            return;

        while (over_max_items_limit() || over_max_thread_age_limit() || over_max_byte_limit()) {
            remove(get_oldest().id);
        }
    }

    function remove(id) {
        var i = get_index(id);

        if (i > -1)
            collection.splice(i, 1);
    }

    function over_max_items_limit() {
        return collection.length >= storage.get_max_items();
    }

    function over_max_thread_age_limit() {
        return get_oldest().timestamp
            < (get_current_timestamp() - options.get_thread_removal_time_secs());
    }

    function over_max_byte_limit() {
        // Assume every character is two bytes
        return JSON.stringify(collection).length * 2 >= storage.get_max_bytes();
    }
})();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "threads.get_by_id") {
        sendResponse(threads.get_by_id(request.id));
    } else if (request.method == "threads.add") {
        threads.add(request.id);
    } else if (request.method == "options.get_all") {
        sendResponse(options.get_all());
    }
});

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "update") {
         var opts = options.get_all();

         storage.clear().then(function() {
             options.save(opts);
         });
    }
});