
class RedditPage {
	id = this.getId();
	lastVisited;

	highlightNewComments() {
		if (!this.id) {
			// not a comment section
			return;
		}

		chrome.runtime.sendMessage({ method: 'threads.getById', id: this.id }, thread => {
			if (thread) {
				this.lastVisited = thread.timestamp;
			}

			chrome.runtime.sendMessage({ method: 'options.getAll' }, function(options) {
				const className = options.useCustomCSS ? options.customCSSClassName : options.defaultCSSClassName;
				const css = options.useCustomCSS ? options.customCSS : this.generateCSS(options.border, options.backColor, options.frontColor);

				this.injectCSS(css);
				this.highlightComments(className);
			});

			chrome.runtime.sendMessage({ method: 'threads.add', id: this.id });
		});
	}

	isCommentSection() {
		return Boolean(document.getElementsByClassName('nestedlisting')[0]);
	}

	getId() {
		if (!this.isCommentSection()) {
			return null;
		}

		const id = document.getElementById('siteTable').firstChild.getAttribute('data-fullname');

		if (!id) {
			return null;
		}

		return id.split('_')[1];
	}

	highlightComments(className) {
		const comments = document.getElementsByClassName('comment');
		const currentUser = this.getCurrentUser();

		for (const comment of comments) {
			// reddit comment date format: 2014-02-20T00:41:27+00:00
			const commentDate = comment.getElementsByTagName('time')[0].getAttribute('datetime');
			if (!commentDate) {
				continue;
			}

			// check and skip if comment is'nt new
			const commentTimestamp = Math.floor(Date.parse(commentDate) / 1000);
			if (commentTimestamp < this.lastVisited) {
				continue;
			}

			// check and skip if comment is by current user
			const commentAuthor = comment.querySelector('.author').innerText;
			if (currentUser.name && currentUser.name === commentAuthor) {
				continue;
			}

			// remove class when clicked
			comment.querySelector('.usertext').addEventListener('click', () => {
				comment.classList.remove(className);
			}, {
				capture: false,
				once: true,
				passive: true
			});

			// add highlight styling
			comment.classList.add(className);
		}
	}

	injectCSS(css) {
		const head = document.getElementsByTagName('head')[0];
		const style = document.createElement('style');
		style.setAttribute('type', 'text/css');
		style.appendChild(document.createTextNode(css));
		head.appendChild(style);
	}

	generateCSS(border, backColor, frontColor) {
		return `
		.comment.highlight > .entry .md {
		    padding: 2px;
		    border: ${border};
		    border-radius: 2px;
		    background-color: ${backColor};
		    color: ${frontColor};
		    transition-property: background-color, border, color;
            transition-duration: 0.5s;
		}`;
	}

	getCurrentUser() {
		const user = {};
		const usernameElement = document.querySelector('.user a');

		if (usernameElement.classList.contains('login-required')) {
			user.name = null;
		} else {
			user.name = usernameElement.innerText;
		}

		return user;
	}
}

const redditPage = new RedditPage();

export { redditPage as RedditPage };
