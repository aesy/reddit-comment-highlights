import ChromeStorage from './ChromeStorage';
import MiniSignal from 'mini-signals';

/**
 * Wrapper for chrome storage for getting and setting extension options
 * @class
 */
class ExtensionOptions {
	/**
	 * @public
	 * @instance
	 * @readonly
	 * @type {MiniSignal}
	 */
	onChange = new MiniSignal();

	/**
	 * @private
	 * @static
	 * @instance
	 * @readonly
	 * @type {string}
	 */
	static STORAGE_KEY = 'reddit_au_options';

	/**
	 * @private
	 * @instance
	 * @type {object}
	 */
	options = {};

	/**
	 * @constructor
	 */
	constructor() {
		// Listen for changes in storage and update internal storage
		ChromeStorage.onChange.add(changes => {
			changes = changes[ExtensionOptions.STORAGE_KEY];

			if (changes === undefined) {
				// No changes to extension options
				return;
			}

			this.options = changes.newValue || {};

			this.onChange.dispatch();
		});

		// Sync internal storage with chrome storage
		ChromeStorage.get(ExtensionOptions.STORAGE_KEY).then(data => {
			this.options = data || {};
		}).catch(this.onError.bind(this));
	}

	/**
	 * Error handler
	 * @private
	 * @param {Error} error
	 */
	onError(error) {
		console.warn('Error: ', error);
	}

	/**
	 * Gets whether user is also a RES user
	 * @returns {boolean|null} is a RES user. Returns null if unknown
	 */
	isResUser() {
		if (this.options.usesRES === undefined) {
			return null;
		}

		return this.options.usesRES;
	}

	/**
	 * Sets whether user is also a RES user
	 * @param {boolean} bool
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setIsResUser(bool) {
		this.options.usesRES = bool;

		return this;
	}

	/**
	 * Gets whether mobile site should redirect to desktop site
	 * @public
	 * @returns {boolean} should redirect
	 */
	getRedirect() {
		if (this.options.redirect === undefined) {
			return this.getDefaultRedirect();
		}

		return this.options.redirect;
	}

	/**
	 * Gets whether mobile site should redirect to desktop site by default
	 * @public
	 * @returns {boolean}
	 */
	getDefaultRedirect() {
		return false;
	}

	/**
	 * Sets whether mobile site should redirect to desktop site
	 * @public
	 * @param {boolean} redirect
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setRedirect(redirect) {
		this.options.redirect = redirect;

		return this;
	}

	/**
	 * Gets whether comment (and possibly its' children) highlights should be cleared when clicked
	 * @public
	 * @returns {{atAll: boolean, includeChildren: boolean}}
	 */
	getClearComment() {
		return {
			atAll: this.options.clearCommentOnClick === undefined ?
								this.getDefaultClearComment().atAll :
								this.options.clearCommentOnClick,
			includeChildren: this.options.clearCommentincludeChildren === undefined ?
								this.getDefaultClearComment().includeChildren :
								this.options.clearCommentincludeChildren
		};
	}

	/**
	 * Gets whether comment (and possibly its' children) highlights should be cleared when clicked by default
	 * @public
	 * @returns {{atAll: boolean, includeChildren: boolean}}
	 */
	getDefaultClearComment() {
		return {
			atAll: false,
			includeChildren: true
		};
	}

	/**
	 * Sets whether comment (and possibly its' children) highlights should be cleared when clicked
	 * @public
	 * @param {boolean} clear
	 * @param {boolean} includeChildren
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setClearComment(clear, includeChildren) {
		this.options.clearCommentOnClick = clear;
		this.options.clearCommentincludeChildren = includeChildren;

		return this;
	}

	/**
	 * Gets the border in the form of a CSS property value
	 * @public
	 * @returns {string} border
	 */
	getBorder() {
		return this.hasBorder() ? this.getDefaultBorder() : '0';
	}

	/**
	 * Gets the default border in the form of a CSS property value
	 * @public
	 * @returns {string} border
	 */
	getDefaultBorder() {
		return '1px dotted #cccccc';
	}

	/**
	 * Sets the border in the form of a CSS property value
	 * @public
	 * @param {string} border
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setBorder(border) {
		this.options.border = border;

		return this;
	}

	/**
	 * Checks whether a border has been set
	 * @public
	 * @returns {boolean} is set
	 */
	hasBorder() {
		// There is a border by default hence returning true if undefined
		return (this.options.border === undefined) || Boolean(this.options.border);
	}

	/**
	 * Gets the background color as a hex color
	 * @public
	 * @returns {string} background hex color
	 */
	getBackgroundColor() {
		return this.options.backColor || this.getDefaultBackgroundColor();
	}

	/**
	 * Gets the default background color as a hex color
	 * @public
	 * @returns {string} default background hex color
	 */
	getDefaultBackgroundColor() {
		return '#fffdcc';
	}

	/**
	 * Sets the background color
	 * @public
	 * @param {string} color as a hex color
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setBackgroundColor(color) {
		this.options.backColor = color;

		return this;
	}

	/**
	 * Gets the background color in night mode as a hex color
	 * @public
	 * @returns {string} background hex color
	 */
	getBackgroundNightColor() {
		return this.options.backNightColor || this.getDefaultBackgroundNightColor();
	}

	/**
	 * Gets the default background color in night mode as a hex color
	 * @public
	 * @returns {string} default background hex color
	 */
	getDefaultBackgroundNightColor() {
		return '#424242';
	}

	/**
	 * Sets the background color in night mode
	 * @public
	 * @param {string} color as a hex color
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setBackgroundNightColor(color) {
		this.options.backNightColor = color;

		return this;
	}

	/**
	 * Gets the text color as a hex color
	 * @public
	 * @returns {string} text hex color
	 */
	getTextColor() {
		return this.options.frontColor || this.getDefaultTextColor();
	}

	/**
	 * Gets the default text color as a hex color
	 * @public
	 * @returns {string} default text hex color
	 */
	getDefaultTextColor() {
		return '#000000';
	}

	/**
	 * Sets the text color
	 * @public
	 * @param {string} color as a hex color
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setTextColor(color) {
		this.options.frontColor = color;

		return this;
	}

	/**
	 * Gets the text color in night mode as a hex color
	 * @public
	 * @returns {string} text hex color
	 */
	getTextNightColor() {
		return this.options.frontNightColor || this.getDefaultTextNightColor();
	}

	/**
	 * Gets the default text color in night mode as a hex color
	 * @public
	 * @returns {string} default text hex color
	 */
	getDefaultTextNightColor() {
		return '#ffffff';
	}

	/**
	 * Sets the text color in night mode
	 * @public
	 * @param {string} color as a hex color
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setTextNightColor(color) {
		this.options.frontColor = color;

		return this;
	}

	/**
	 * Gets the link color as a hex color
	 * @public
	 * @returns {string} text hex color
	 */
	getLinkColor() {
		return this.options.linkColor || this.getDefaultLinkColor();
	}

	/**
	 * Gets the default link color as a hex color
	 * @public
	 * @returns {string} default text hex color
	 */
	getDefaultLinkColor() {
		return '#0079d3';
	}

	/**
	 * Sets the link color
	 * @public
	 * @param {string} color as a hex color
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setLinkColor(color) {
		this.options.linkColor = color;

		return this;
	}

	/**
	 * Gets the link color in night mode as a hex color
	 * @public
	 * @returns {string} text hex color
	 */
	getLinkNightColor() {
		return this.options.linkNightColor || this.getDefaultLinkNightColor();
	}

	/**
	 * Gets the default link color in night mode as a hex color
	 * @public
	 * @returns {string} default text hex color
	 */
	getDefaultLinkNightColor() {
		return '#8cb3d9';
	}

	/**
	 * Sets the link color in night mode
	 * @public
	 * @param {string} color as a hex color
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setLinkNightColor(color) {
		this.options.linkNightColor = color;

		return this;
	}

	/**
	 * Gets the quote text color as a hex color
	 * @public
	 * @returns {string} text hex color
	 */
	getQuoteTextColor() {
		return this.options.quoteTextColor || this.getDefaultQuoteTextColor();
	}

	/**
	 * Gets the default quote text color as a hex color
	 * @public
	 * @returns {string} default text hex color
	 */
	getDefaultQuoteTextColor() {
		return '#4f4f4f';
	}

	/**
	 * Sets the quote text color
	 * @public
	 * @param {string} color as a hex color
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setQuoteTextColor(color) {
		this.options.quoteTextColor = color;

		return this;
	}

	/**
	 * Gets the quote text color in night mode as a hex color
	 * @public
	 * @returns {string} text hex color
	 */
	getQuoteTextNightColor() {
		return this.options.quoteTextNightColor || this.getDefaultQuoteTextNightColor();
	}

	/**
	 * Gets the default quote text color in night mode as a hex color
	 * @public
	 * @returns {string} default text hex color
	 */
	getDefaultQuoteTextNightColor() {
		return '#a0a0a0';
	}

	/**
	 * Sets the quote text color in night mode
	 * @public
	 * @param {string} color as a hex color
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setQuoteTextNightColor(color) {
		this.options.quoteTextNightColor = color;

		return this;
	}

	/**
	 * Gets the CSS for comment highlights
	 * @public
	 * @returns {string} css
	 */
	getCSS() {
		if (this.usesCustomCSS()) {
			return this.getCustomCSS();
		}

		let CSS = `
			.comment.${this.getDefaultCSSClassName()}--transition  > .entry .md {
				transition-property: padding, border, background-color, color;
                transition-duration: 0.2s;
			}
			
			.comment.${this.getDefaultCSSClassName()} > .entry .md {
			    padding: 2px;
			    border: ${this.getBorder()};
			    border-radius: 2px;
			    background-color: ${this.getBackgroundColor()};
			    color: ${this.getTextColor()};
			}
			
			.comment.${this.getDefaultCSSClassName()} > .entry .md a {
				color: ${this.getLinkColor()}
			}
		`;

		if (this.isResUser()) {
			CSS += `
				.res-nightmode .comment.${this.getDefaultCSSClassName()} > .entry .md {
					padding: 2px;
					border: ${this.getBorder()};
					border-radius: 2px;
					background-color: ${this.getBackgroundNightColor()};
					color: ${this.getTextNightColor()}
				}
				
				.res-nightmode .comment.${this.getDefaultCSSClassName()} > .entry .md a {
					color: ${this.getLinkNightColor()}
				}
			`;
		}

		return CSS;
	}

	/**
	 * Checks whether custom CSS has been set
	 * @public
	 * @returns {boolean} is set
	 */
	usesCustomCSS() {
		return Boolean(this.getCustomCSS());
	}

	/**
	 * Gets the custom CSS. Will return an empty string if empty.
	 * @public
	 * @returns {string} custom css
	 */
	getCustomCSS() {
		return this.options.customCSS || '';
	}

	/**
	 * Sets the custom CSS
	 * @public
	 * @param {string} css
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setCustomCSS(css) {
		this.options.customCSS = css;

		return this;
	}

	/**
	 * Gets the CSS class name for comment highlights. Will check whether custom class name, if set, is valid.
	 * @public
	 * @returns {string} class name
	 */
	getCSSClassName() {
		const className = this.options.customCSSClassName;
		const isValid = this.isValidCSSClassName(className);

		if (this.usesCustomCSS() && isValid) {
			return className;
		}

		return this.getDefaultCSSClassName();
	}

	/**
	 * Sets the CSS class name
	 * @public
	 * @param {string} className
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setCustomCSSClassName(className) {
		this.options.customCSSClassName = className;

		return this;
	}

	/**
	 * Gets the default CSS class name
	 * @public
	 * @returns {string} class name
	 */
	getDefaultCSSClassName() {
		return 'highlight';
	}

	/**
	 * Checks whether a CSS class name is valid
	 * @public
	 * @param {string} className
	 * @returns {boolean} is valid
	 */
	isValidCSSClassName(className) {
		return /^([a-z_]|-[a-z_-])[a-z\d_-]*$/i.test(className);
	}

	/**
	 * Gets the thread removal time limit for threads in seconds
	 * @public
	 * @returns {number} time limit
	 */
	getThreadRemovalTimeSecs() {
		return this.options.threadRemovalTimeSeconds || this.getDefaultThreadRemovalSeconds();
	}

	/**
	 * Gets the default removal time limit for threads in seconds
	 * @public
	 * @returns {number} default time limit
	 */
	getDefaultThreadRemovalSeconds() {
		return 604800; // A week
	}

	/**
	 * Sets the thread removal time limit for threads
	 * @public
	 * @param {number} seconds
	 * @returns {ExtensionOptions} this instance for chaining purposes
	 */
	setThreadRemovalSeconds(seconds) {
		this.options.threadRemovalTimeSeconds = seconds;

		return this;
	}

	/**
	 * Saves internal options to browser storage
	 * This is an async operation
	 * @public
	 * @returns {Promise} resolves on completion
	 */
	save() {
		return ChromeStorage.set(ExtensionOptions.STORAGE_KEY, this.options).catch(this.onError.bind(this));
	}

	/**
	 * Clears the options, setting everything to their default settings
	 * This is an async operation
	 * @public
	 * @returns {Promise} resolves on completion
	 */
	clear() {
		this.options = {};
		return this.save();
	}
}

// Only one instance of this class needed
export default new ExtensionOptions();
