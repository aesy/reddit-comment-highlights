/**
 * Creates a CSS style tag and appends it to an element
 * @param css The CSS to inject
 * @param element The element to inject into
 */
export function injectCSS(css: string, element: Element): void {
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.appendChild(document.createTextNode(css));
    element.appendChild(style);
}

/**
 * Finds the closest parent that matches a selector
 * @param element The starting element
 * @param selector The selector to match against
 * @return The closest parent, or null if no matching element was found
 */
export function findClosestParent(element: Node, selector: string): Node | null {
    let currentElement: Node | null = element;

    while (currentElement && currentElement !== document) {
        currentElement = currentElement.parentNode;

        if (!(currentElement instanceof Element)) {
            continue;
        }

        if (currentElement.matches(selector)) {
            return currentElement;
        }
    }

    return null;
}
