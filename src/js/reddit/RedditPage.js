/**
 * Represents a reddit page
 * @class
 */
class RedditPage {
	/**
	 * @callback OnChangeCallback
	 * @param {Element[]} comments
	 */

	/**
	 * @private
	 * @instance
	 * @type {OnChangeCallback[]}
	 */
	listeners = [];

	/**
	 * @private
	 * @instance
	 * @type {MutationObserver}
	 */
	newCommentObserver = new MutationObserver(event => {
		const comments = event.filter(rec => {
			// Filter out anything that's not a sitetable sibling
			return rec.target.classList.contains('sitetable');
		}).reduce((acc, rec) => {
			// Convert NodeList to array
			const nodes = Array.prototype.slice.call(rec.addedNodes);

			return acc.concat(nodes);
		}, []).filter(elem => {
			// Filter out anything that's not a comment
			return elem.classList.contains('comment');
		});

		if (comments.length > 0) {
			// Notify listeners of changes
			for (const listener of this.listeners) {
				listener(comments);
			}
		}
	});

	/**
	 * @constructor
	 */
	constructor() {
		if (this.isACommentThread()) {
			const root = document.querySelector('.sitetable.nestedlisting');

			if (root) {
				// Listen for new comments
				this.newCommentObserver.observe(root, {
					attributes: false,
					characterData: false,
					childList: true,
					subtree: true
				});
			} else {
				console.error('Could not get root comment listing although page was interpreted as a comment thread');
			}
		}
	}

	/**
	 * Adds a listener which is invoked when one or more comments are added to the page
	 * @param {OnChangeCallback} listener
	 */
	onCommentAdded(listener) {
		this.listeners.push(listener);
	}

	/**
	 * Highlights an array of comment elements
	 * @public
	 * @param {Element[]} comments elements
	 * @param {string} className CSS class name to add to elements
	 */
	highlightComments(comments, className) {
		for (const comment of comments) {
			this.highlightComment(comment, className);
		}
	}

	/**
	 * Highlights a single comment element
	 * @public
	 * @param {Element} comment element
	 * @param {string} className CSS class name to add to element
	 */
	highlightComment(comment, className) {
		comment.classList.add(`${className}--transition`);
		comment.classList.add(className);
	}

	/**
	 * Attaches a click listener to a single comment element, which removes its' highlights
	 * @public
	 * @param {Element} comment element
	 * @param {string} className CSS class name to remove from element
	 * @param {boolean} includeChildren
	 */
	clearHighlightOnClick(comment, className, includeChildren) {
		// Comments to clear on click
		const clear = [comment];

		if (includeChildren) {
			const childComments = comment.getElementsByClassName('comment');
			clear.push.apply(clear, childComments);
		}

		comment.addEventListener('click', () => {
			for (const comment of clear) {
				comment.classList.remove(className);
				// Can't be removed before transition has finished
				// comment.classList.remove(`${className}--transition`);
			}
		}, {
			capture: false,
			once: true,
			passive: true
		});
	}

	/**
	 * Checks whether the currently open page is a reddit comment thread
	 * @public
	 * @returns {boolean}
	 */
	isACommentThread() {
		const pathPieces = document.location.pathname.split('/');

		// Check if url is in the form of '/r/<subreddit>/comments/...
		return pathPieces[1] === 'r' && pathPieces[3] === 'comments';
	}

	/**
	 * Checks whether the currently open page is a reddit comment thread at root level (not perma-link)
	 * @public
	 * @returns {boolean}
	 */
	isARootLevelCommentThread() {
		const pathPieces = document.location.pathname.split('/');

		return this.isACommentThread() && pathPieces.length < 8;
	}

	/**
	 * Gets the id of the currently open page
	 * @public
	 * @returns {string|null} id, null if current page is not a reddit comment section
	 */
	getId() {
		// Get the path of the thread (works on mobile, too)
		const pathPieces = document.location.pathname.split('/');

		// The 4th item in the path *should* always be the thread id
		return pathPieces[4] || null;
	}

	/**
	 * Gets comments newer than a specified timestamp
	 * @public
	 * @param {number} timestamp
	 * @param {Node|Element[]} comments  parent node or array of comments to sift through
	 * @returns {Element[]} elements of comments
	 */
	getCommentsNewerThan(timestamp, comments) {
		const results = [];

		if (comments instanceof Node) {
			comments = comments.getElementsByClassName('comment');
		}

		for (const comment of comments) {
			const timeTag = comment.getElementsByTagName('time')[0];

			if (!timeTag) {
				// Deleted comments does not have a time tag and should be skipped
				continue;
			}

			// Reddit comment date format: 2014-02-20T00:41:27+00:00
			const commentDate = timeTag.getAttribute('datetime');

			if (!commentDate) {
				continue;
			}

			const commentTimestamp = Math.floor(Date.parse(commentDate) / 1000);

			if (commentTimestamp < timestamp) {
				// Skip if comment is'nt new
				continue;
			}

			results.push(comment);
		}

		return results;
	}

	/**
	 * Gets the currently logged in user. It checks if the username is visible in the page header. It's a bit of a hack.
	 * @public
	 * @returns {{name: string}|null} user
	 */
	getCurrentUser() {
		const usernameElement = document.querySelector('.user a');

		if (usernameElement.classList.contains('login-required')) {
			// Noone logged in
			return null;
		}

		const username = usernameElement.textContent;

		if (!username) {
			return null;
		}

		return {
			name: username
		};
	}

	/**
	 * Redirects the browser to desktop version of the site
	 * @public
	 */
	redirectToDesktop() {
		const desktopURL = document.location.href.replace('m.reddit.com', 'reddit.com');

		document.location.replace(desktopURL);
	}

	/**
	 * Checks whether current site is the mobile version of the site
	 * @public
	 * @returns {boolean} is mobile site
	 */
	isMobileSite() {
		return document.location.hostname === 'm.reddit.com';
	}
}

// Only one instance of this class needed
export default new RedditPage();
