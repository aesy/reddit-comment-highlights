
/**
 * Creates a CSS style tag and appends it to an element
 * @param {string} css
 * @param {Element} element
 */
export function injectCSS(css, element) {
	const style = document.createElement('style');
	style.setAttribute('type', 'text/css');
	style.appendChild(document.createTextNode(css));
	element.appendChild(style);
}

/**
 * Finds the closest parent that matches a selector
 * @param {Node} element The starting element
 * @param {String} selector The selector to match against
 * @return {Node|null} The closest parent, or null if no matching element was found.
 */
export function findClosestParent(element, selector) {
	while (element && element !== document) {
		element = element.parentNode;

		if (element.matches(selector)) {
			return element;
		}
	}

	return null;
}
