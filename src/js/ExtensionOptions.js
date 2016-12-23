import ChromeStorage from './ChromeStorage';
import MiniSignal from 'mini-signals';

/**
 * Wrapper for chrome storage for working with extension options
 * @class
 */
class ExtensionOptions {
	/**
	 * @public
	 * @instance
	 * @type {MiniSignal}
	 */
	onChange = new MiniSignal();

	/**
	 * @private
	 * @static
	 * @instance
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
		// listen for changes in storage and update internal storage
		ChromeStorage.onChange.add(changes => {
			changes = changes[ExtensionOptions.STORAGE_KEY];

			if (!changes) {
				// no changes to extension options
				return;
			}

			this.options = changes.newValue || {};

			this.onChange.dispatch();
		});

		// sync internal storage with chrome storage
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
		return '1px dotted #ccc';
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
		// there is a border by default hence returning true if undefined
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
		return '#000';
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
	 * Gets the CSS for comment highlights
	 * @public
	 * @returns {string} css
	 */
	getCSS() {
		if (this.usesCustomCSS()) {
			return this.getCustomCSS();
		}

		return `
		.comment.highlight > .entry .md {
		    padding: 2px;
		    border: ${this.getBorder()};
		    border-radius: 2px;
		    background-color: ${this.getBackgroundColor()};
		    color: ${this.getTextColor()};
		    transition-property: background-color, border, color;
            transition-duration: 0.5s;
		}`;
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
			return this.getCustomCSSClassName();
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
		return 604800; // a week
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
	 * Saves internal options to browser storage. This is an async operation, hence the promise.
	 * @public
	 * @returns {Promise}
	 */
	save() {
		return ChromeStorage.set(ExtensionOptions.STORAGE_KEY, this.options).catch(this.onError.bind(this));
	}

	/**
	 * Clears the options, setting everything to their default settings. This is an async operation, hence the promise.
	 * @public
	 * @returns {Promise}
	 */
	clear() {
		this.options = {};
		return this.save();
	}
}

// only one instance of this class needed
export default new ExtensionOptions();
