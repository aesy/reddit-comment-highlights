import { injectCSS } from './DOMUtils';

/**
 * Represents a reddit page (supposed to, anyway) with relevant methods for the chrome extension
 * @class
 */
class RedditPage {
	/**
	 * @private
	 * @instance
	 * @readonly
	 * @type {string|null}
	 */
	id = this.getId();

	/**
	 * @private
	 * @instance
	 * @type {number}
	 */
	lastVisited;

	/**
	 * Highlights new comments on the current page
	 * @public
	 */
	highlightNewComments() {
		if (!this.id) {
			// not a comment section
			return;
		}

		chrome.runtime.getBackgroundPage(background => {
			const ThreadStorage = background.ThreadStorage;
			const ExtensionOptions = background.ExtensionOptions;

			const thread = ThreadStorage.getById(this.id);

			if (!thread) {
				// first time in comment section
				return;
			}

			this.lastVisited = thread.timestamp;
			const className = ExtensionOptions.getClassName();
			const css = ExtensionOptions.getCSS();
			const head = document.getElementsByTagName('head')[0];

			injectCSS(css, head);

			for (const comment of this.getNewComments()) {
				this.highlightComment(comment, className);
			}
		});
	}

	/**
	 * Highlights a single comment element
	 * @public
	 * @param {Element} comment element
	 * @param {string} className CSS class name to add to element
	 */
	highlightComment(comment, className) {
		// add highlight styling
		comment.classList.add(className);

		// remove CSS when clicked
		comment.querySelector('.usertext').addEventListener('click', () => {
			comment.classList.remove(className);
		}, {
			capture: false,
			once: true,
			passive: true
		});
	}

	/**
	 * Checks whether the currently open page is a reddit comment section
	 * @public
	 * @returns {boolean}
	 */
	isCommentSection() {
		return Boolean(document.getElementsByClassName('nestedlisting')[0]);
	}

	/**
	 * Gets the id of the currently open page
	 * @public
	 * @returns {string|null} id, null if current page is not a reddit comment section
	 */
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

	/**
	 * Gets all new comments
	 * @public
	 * @returns {Element[]} elements of new comments
	 */
	getNewComments() {
		const results = [];
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

			results.push(comment);
		}

		return results;
	}

	/**
	 * Gets the current logged in user. It checks if the username is visible in the page header. It's a bit of a hack.
	 * @public
	 * @returns {{name: string}} user
	 */
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

// only one instance of this class needed
export default new RedditPage();
