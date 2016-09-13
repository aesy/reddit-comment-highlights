var redditPage = (function() {
	var id;
	var lastVisited;

	return {
		init: init
	};

	function init() {
		id = getThreadId();

		if (!id) {
			return;
		}

		chrome.runtime.sendMessage({ method: 'threads.getById', id: id }, function(response) {
			if (response) {
				lastVisited = response.timestamp;
			}

			process();
		});
	}

	function process() {
		chrome.runtime.sendMessage({ method: 'options.getAll' }, function(response) {
			if (lastVisited) {
				highlightComments(response.border, response.color, response.front_color);
			}
		});

		chrome.runtime.sendMessage({ method: 'threads.add', id: id });
	}

	function getThreadId() {
		// Checks if currently in thread comment section
		if (!document.getElementsByClassName('nestedlisting')[0]) {
			return null;
		}

		var threadId = document.getElementById('siteTable').firstChild.getAttribute('data-fullname');

		if (!threadId) {
			return null;
		}

		return threadId.split('_')[1];
	}

	function highlightComments(border, backColor, frontColor) {
		var comments = document.getElementsByClassName('nestedlisting')[0].getElementsByClassName('tagline');

		for (var i = 0; i < comments.length; i++) {
			var comment = comments[i];

			// reddit comment date format: 2014-02-20T00:41:27+00:00
			var commentDate = comment.getElementsByTagName('time')[0].getAttribute('datetime');
			if (!commentDate) {
				continue;
			}

			var commentTimestamp = Math.floor(Date.parse(commentDate) / 1000);
			if (commentTimestamp < lastVisited) {
				continue;
			}

			var commentBody = comment.nextElementSibling.getElementsByClassName('md')[0];
			commentBody.style.padding = '2px';
			commentBody.style.borderRadius = '2px';
			commentBody.style.border = border;
			commentBody.style.backgroundColor = backColor;
			commentBody.style.color = frontColor;
		}
	}
})();

redditPage.init();
