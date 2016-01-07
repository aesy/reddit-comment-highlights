var reddit_page = (function() {
    var id,
        last_visited;

    return {
        init: init
    };

    function init() {
        id = get_thread_id();

        if (!id)
            return;

        chrome.runtime.sendMessage({method: "threads.get_by_id", id: id}, function(response) {
            if (response)
                last_visited = response.timestamp;

            process();
        });
    }

    function process() {
        chrome.runtime.sendMessage({method: "options.get_all"}, function(response) {
            if (last_visited)
                highlight_comments(response.border, response.color);
        });

        chrome.runtime.sendMessage({method: "threads.add", id: id});
    }

    function get_thread_id() {
        // Checks if currently in thread comment section
        if (!document.getElementsByClassName('nestedlisting')[0])
            return null;

        var thread_id = document.getElementById('siteTable').firstChild.getAttribute('data-fullname');

        if (!thread_id)
            return null;

        return thread_id.split("_")[1];
    }

    function highlight_comments(border, color) {
        var comments = document.getElementsByClassName('nestedlisting')[0].getElementsByClassName("tagline");

        for (var i = 0; i < comments.length - 1; i++) {
            var comment = comments[i];

            // reddit_page comment date format: 2014-02-20T00:41:27+00:00
            var comment_date = comment.getElementsByTagName("time")[0].getAttribute("datetime");
            if (!comment_date)
                continue;

            var comment_timestamp = Math.floor(Date.parse(comment_date) / 1000);
            if (comment_timestamp < last_visited)
                continue;

            var comment_body = comment.nextElementSibling.getElementsByClassName("md")[0];
            comment_body.style.padding = "2px";
            comment_body.style.borderRadius = "2px";
            comment_body.style.border = border;
            comment_body.style.backgroundColor = color;
        }
    }
})();

reddit_page.init();