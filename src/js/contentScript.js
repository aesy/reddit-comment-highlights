import RedditPage from './reddit/RedditPage';
import { injectCSS } from './utils/DOMUtils';

/* This script is injected into every reddit page */

chrome.runtime.sendMessage({ method: 'ExtensionOptions.getAll' }, options => {
	if (options.redirect && RedditPage.isMobileSite()) {
		RedditPage.redirectToDesktop();
		return;
	}

	if (!RedditPage.isACommentThread()) {
		return;
	}

	const threadId = RedditPage.getId();

	if (!threadId) {
		console.error('Could not read thread ID although page was interpreted as a comment thread');
		return;
	}

	chrome.runtime.sendMessage({ method: 'ThreadStorage.getById', threadId }, thread => {
		if (RedditPage.isARootLevelCommentThread()) {
			// Only consider comment section viewed if at root level
			chrome.runtime.sendMessage({ method: 'ThreadStorage.add', threadId });
		}

		if (!thread) {
			// First time in comment section, no highlights
			return;
		}

		injectCSS(options.css, document.getElementsByTagName('head')[0]);

		const root = document.querySelector('.sitetable.nestedlisting');
		const user = RedditPage.getCurrentUser();

		/**
		 * Filters out relevant comments
		 * @param {Node|Element[]} comments
		 * @returns {Element[]}
		 */
		function filter(comments) {
			return RedditPage.getCommentsNewerThan(thread.timestamp, comments)
				.filter(comment => {
					const author = comment.querySelector('.author');

					if (!author) {
						// Deleted comment, keep it
						return true;
					}

					// Filter out logged in users' comments
					return user && user.name !== author.textContent;
				});
		}

		/**
		 * Update comment styling
		 * @param {Element[]} comments
		 */
		function update(comments) {
			RedditPage.highlightComments(comments, options.className);

			if (options.clearComment.atAll) {
				const includeChildren = options.clearComment.includeChildren;

				for (const comment of comments) {
					RedditPage.clearHighlightOnClick(comment, options.className, includeChildren);
				}
			}
		}

		update(filter(root));
		RedditPage.onCommentAdded(comments => update(filter(comments)));
	});
});
