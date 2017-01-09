
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
