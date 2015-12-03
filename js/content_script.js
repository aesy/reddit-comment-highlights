var reddit_page = (function() {
    var id = null;
    var last_visited = null;

    var init = function() {
        id = get_thread_id();

        if (!id)
            return;

        chrome.runtime.sendMessage({method: "threads.get_by_id", id: id}, function(response) {
            last_visited = response.timestamp;

            if (last_visited)
                process();
        });
    };

    var process = function() {
        chrome.runtime.sendMessage({method: "options.get_all"}, function(response) {
            highlight_comments(response.border, response.color);
        });

        chrome.runtime.sendMessage({method: "threads.add", id: id});
    };

    var get_thread_id = function() {
        var site_table = document.getElementsByClassName('nestedlisting')[0];

        if (!site_table)
            return null;

        var thread_id = site_table.firstChild.getAttribute('data-fullname');

        if (!thread_id)
            return null;

        return thread_id.split("_")[1];
    };

    var highlight_comments = function(border, color) {
        var comments = document.getElementsByClassName("tagline");

        for (var i = 0; i < comments.length; i++) {
            var comment = comments[i];

            // reddit_page comment date format: 2014-02-20T00:41:27+00:00
            var comment_date = comment.getElementsByTagName("time")[0].getAttribute("datetime");
            if (!comment_date)
                return;

            var comment_timestamp = Date.parse(comment_date);
            if (comment_timestamp < last_visited)
                return;

            var comment_body = comment.nextElementSibling.getElementsByClassName("md");
            comment_body.style.padding = "2px";
            comment_body.style.borderRadius = "2px";
            comment_body.style.border = border;
            comment_body.style.backgroundColor = color;
        }
    };

    return {
        init: init
    };
})();

reddit_page.init();