var redditPage = (function() {
	var id;
	var lastVisited;

	return {
		init: init
	};

	function init() {
		chrome.runtime.sendMessage({ method: 'options.getShouldRedirect'}, function(shouldRedirect) {
			if (shouldRedirect) {
				redirectToDesktop();
			}
		});
        
        var threadId = getThreadId();
		if (!threadId) {
			return;
		}

		chrome.runtime.sendMessage({ method: 'threads.getById', threadId: threadId }, function(response) {
            if (response) {
				lastVisited = response.timestamp;
			}

			process(threadId);
		});
	}
    
    function redirectToDesktop() {
        var url = document.location;                         
    
        // Replace an m.reddit.com url with www.reddit.com (keeping the original scheme and path).
        if (url.host == 'm.reddit.com') {
            var desktopUri = url.href.replace("m.reddit.com", "www.reddit.com");
            document.location.replace(desktopUri);            
        }
    }

	function process(threadId) {
		chrome.runtime.sendMessage({ method: 'options.getAll' }, function(response) {
			if (!lastVisited) {
				return;
			}

			var css = '';
			var className = response.useCustomCSS ? response.customCSSClassName : response.defaultCSSClassName;

			if (response.useCustomCSS) {
				css += response.customCSS;
			} else {
				css += generateCSS(response.border, response.backColor, response.frontColor);
			}

			injectCSS(css);
			highlightComments(className);
		});

		chrome.runtime.sendMessage({ method: 'threads.add', threadId: threadId });
	}

	function getThreadId() {
        // Get the path of the thread (works on mobile, too).
        var urlPath = document.location.pathname;
        var pathPieces = urlPath.split('/')
        
        // Checks the page is a reddit thread.
        if (pathPieces[1] != 'r') {
            return;
        }
        
        // The 4th item in the path *should* always be the thread identifier.
        // '/r/worldnews/comments/5jwax4/name_of_article/.attributes
        var threadId = pathPieces[4];
        return threadId;
	}

	function highlightComments(className) {
		var comments = document.getElementsByClassName('comment');
		var currentUser = getCurrentUser();

		for (var i = 0; i < comments.length; i++) {
			var comment = comments[i];

			// reddit comment date format: 2014-02-20T00:41:27+00:00
			var commentDate = comment.getElementsByTagName('time')[0].getAttribute('datetime');
			if (!commentDate) {
				continue;
			}

			// check and skip if comment is'nt new
			var commentTimestamp = Math.floor(Date.parse(commentDate) / 1000);
			if (commentTimestamp < lastVisited) {
				continue;
			}

			// check and skip if comment is by current user
			var commentAuthor = comment.querySelector('.author').innerText;
			if (currentUser.name && currentUser.name === commentAuthor) {
				continue;
			}

			comment.classList.add(className);
		}
	}

	function injectCSS(css) {
		var head = document.getElementsByTagName('head')[0];
		var style = document.createElement('style');
		style.setAttribute('type', 'text/css');
		style.appendChild(document.createTextNode(css));
		head.appendChild(style);
	}

	function generateCSS(border, backColor, frontColor) {
		return [
			'.comment.highlight > .entry .md {',
			'  padding: 2px;',
			'  border: ' + border + ';',
			'  border-radius: 2px;',
			'  background-color: ' + backColor + ';',
			'  color: ' + frontColor + ';',
			'}'
		].join('');
	}

	function getCurrentUser() {
		var user = {};
		var usernameElement = document.querySelector('.user a');

		if (usernameElement.classList.contains('login-required')) {
			user.name = null;
		} else {
			user.name = usernameElement.innerText;
		}

		return user;
	}
})();

redditPage.init();
