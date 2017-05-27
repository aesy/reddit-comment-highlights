import '../css/page/options/module.scss';

/**
 * Collection of commonly used DOM Elements
 * @type {object<string, Element|Element[]>}
 */
const element = {
	content: document.querySelector('.main-content'),
	CSSTextArea: document.getElementById('CSS-text'),
	CSSClassNameInput: document.getElementById('class-name'),
	CSSClassName: document.querySelector('.class-name'),
	borderInput: document.getElementById('border'),
	clearCommentInput: document.getElementById('clear-comment'),
	clearChildrenInput: document.getElementById('clear-child-comments'),
	frequencyInput: document.getElementById('frequency'),
	frequencyNumber: document.getElementById('frequency-number'),
	frequencyUnit: document.getElementById('frequency-unit'),
	redirectInput: document.getElementById('redirect'),
	colorPickerRadioButton: document.getElementById('color-pickers'),
	customCSSRadioButton: document.getElementById('custom-css'),
	statusMessage: document.getElementById('status-message'),
	styleModes: document.querySelectorAll('input[name="style-mode"]'),
	RESDialog: document.getElementById('RES'),
	RESSettings: document.querySelectorAll('.RES'),
	advancedDialog: document.getElementById('advanced'),
	advancedSettings: document.querySelectorAll('.advanced'),
	advancedButton: document.getElementById('show-advanced'),
	saveButton: document.getElementById('save-options'),
	tabs: document.querySelectorAll('.main-content__tab'),
	resetButton: document.getElementById('clear-all'),
	year: document.getElementById('footer__year'),
	backgroundColorPicker: document.getElementById('back-color'),
	backgroundNightColorPicker: document.getElementById('back-color-night'),
	textColorPicker: document.getElementById('front-color'),
	textNightColorPicker: document.getElementById('front-color-night'),
	customLinkColor: document.getElementById('custom-link-color'),
	linkColorPicker: document.getElementById('link-color'),
	linkNightColorPicker: document.getElementById('link-color-night'),
	customQuoteColor: document.getElementById('custom-quote-color'),
	quoteTextColorPicker: document.getElementById('quote-text-color'),
	quoteTextNightColorPicker: document.getElementById('quote-text-color-night')
};

/**
 * Collection of page state variables
 * @type {object<string, boolean>}
 */
const state = {
	showAdvancedSettings: false,
	showResSettings: null
};

/**
 * Initializes view, adds listeners and updates view
 */
function initialize() {
	initializeListeners();
	load();
}

/**
 * Adds listeners to elements
 */
function initializeListeners() {
	element.saveButton.addEventListener('click', save);
	element.resetButton.addEventListener('click', reset);
	element.advancedButton.addEventListener('click', () => {
		state.showAdvancedSettings = true;
		update();
	});
	element.clearCommentInput.addEventListener('click', update);
	element.customLinkColor.addEventListener('click', update);
	element.customQuoteColor.addEventListener('click', update);
	element.frequencyInput.addEventListener('input', update);
	element.RESDialog.querySelector('#use-res-yes').addEventListener('click', () => {
		state.showResSettings = true;
		update();
		saveShowResOptions();
	});
	element.RESDialog.querySelector('#use-res-no').addEventListener('click', () => {
		state.showResSettings = false;
		update();
		saveShowResOptions();
	});
	element.CSSClassNameInput.addEventListener('input', () => {
		const selection = {
			start: element.CSSClassNameInput.selectionStart,
			end: element.CSSClassNameInput.selectionEnd
		};

		// This loses the selection of the input for some reason
		update();

		// Restore selection (has to be async)
		setTimeout(() => {
			element.CSSClassNameInput.setSelectionRange(selection.start, selection.end);
		}, 0);
	});

	for (const styleMode of element.styleModes) {
		styleMode.addEventListener('click', update);
	}
}

/**
 * @class
 * @abstract
 */
class Message {
	/**
	 * @private
	 * @instance
	 * @type {number}
	 */
	static timeOutId;

	/**
	 * Shows a message
	 * @param {string} text to display
	 * @param {boolean} [isError = false]
	 */
	static show(text, isError = false) {
		element.statusMessage.textContent = text;
		element.statusMessage.classList.add('status-message--is-visible');

		if (Message.TimeOutId) {
			clearTimeout(Message.TimeOutId);
		}

		element.statusMessage.classList.toggle('status-message--success', !isError);
		element.statusMessage.classList.toggle('status-message--error', isError);

		Message.TimeOutId = setTimeout(() => {
			element.statusMessage.classList.remove('status-message--is-visible');
		}, 3000);
	}
}

function saveShowResOptions() {
	chrome.runtime.getBackgroundPage(background => {
		const ExtensionOptions = background.ExtensionOptions;

		ExtensionOptions
			.setIsResUser(state.showResSettings);

		ExtensionOptions.save().then(() => {
			Message.show('Affirmative!', false);
		}).catch(error => {
			Message.show('Oops, Something happened! (see console for detailed error message)', true);
			console.warn(error);
		});
	});
}

/**
 * Saves the current options to chrome storage
 */
function save() {
	chrome.runtime.getBackgroundPage(background => {
		const ExtensionOptions = background.ExtensionOptions;

		ExtensionOptions
			.setBackgroundColor(element.backgroundColorPicker.value)
			.setBackgroundNightColor(element.backgroundNightColorPicker.value)
			.setTextColor(element.textColorPicker.value)
			.setTextNightColor(element.textNightColorPicker.value)
			.setLinkColor(element.customLinkColor.checked ? element.linkColorPicker.value : null)
			.setLinkNightColor(element.customLinkColor.checked ? element.linkNightColorPicker.value : null)
			.setQuoteTextColor(element.customQuoteColor.checked ? element.quoteTextColorPicker.value : null)
			.setQuoteTextNightColor(element.customQuoteColor.checked ? element.quoteTextNightColorPicker.value : null)
			.setThreadRemovalSeconds(element.frequencyInput.value * 86400)
			.setBorder(element.borderInput.checked)
			.setClearComment(element.clearCommentInput.checked, element.clearChildrenInput.checked)
			.setRedirect(element.redirectInput.checked)
			.setCustomCSS(element.customCSSRadioButton.checked ? element.CSSTextArea.value : '')
			.setCustomCSSClassName(element.CSSClassNameInput.value)
			.setIsResUser(state.showResSettings);

		ExtensionOptions.save().then(() => {
			Message.show('Settings saved!', false);
		}).catch(error => {
			Message.show('Save unsuccessful (see console for detailed error message)', true);
			console.warn(error);
		});
	});
}

/**
 * Resets the options in storage and view
 */
function reset() {
	chrome.runtime.getBackgroundPage(background => {
		const ExtensionOptions = background.ExtensionOptions;
		const ChromeStorage = background.ChromeStorage;

		state.showAdvancedSettings = false;

		ExtensionOptions.onChange.once(load);

		ChromeStorage.clear().then(() => {
			Message.show('Settings reset!', false);
		}).catch(error => {
			Message.show('Reset unsuccessful (see console for detailed error message)', true);
			console.warn(error);
		});
	});
}

/**
 * Loads the options from storage and updates view
 */
function load() {
	chrome.runtime.getBackgroundPage(background => {
		const ExtensionOptions = background.ExtensionOptions;

		element.backgroundColorPicker.value = ExtensionOptions.getBackgroundColor();
		element.backgroundNightColorPicker.value = ExtensionOptions.getBackgroundNightColor();
		element.textColorPicker.value = ExtensionOptions.getTextColor();
		element.textNightColorPicker.value = ExtensionOptions.getTextNightColor();
		element.linkColorPicker.value = ExtensionOptions.getLinkColor() || ExtensionOptions.getDefaultLinkColor();
		element.linkNightColorPicker.value = ExtensionOptions.getLinkNightColor() || ExtensionOptions.getDefaultLinkNightColor();
		element.quoteTextColorPicker.value = ExtensionOptions.getQuoteTextColor() || ExtensionOptions.getDefaultQuoteTextColor();
		element.quoteTextNightColorPicker.value = ExtensionOptions.getQuoteTextNightColor() || ExtensionOptions.getDefaultQuoteTextNightColor();
		element.CSSTextArea.value = ExtensionOptions.getCustomCSS();
		element.CSSClassNameInput.value = ExtensionOptions.getCSSClassName();
		element.frequencyInput.value = ExtensionOptions.getThreadRemovalTimeSecs() / 86400;
		element.redirectInput.checked = ExtensionOptions.getRedirect();
		element.borderInput.checked = ExtensionOptions.hasBorder();
		element.clearCommentInput.checked = ExtensionOptions.getClearComment().atAll;
		element.clearChildrenInput.checked = ExtensionOptions.getClearComment().includeChildren;
		element.customLinkColor.checked = ExtensionOptions.getLinkColor() !== null;
		element.customQuoteColor.checked = ExtensionOptions.getQuoteTextColor() !== null;

		state.showResSettings = ExtensionOptions.isResUser();

		if (ExtensionOptions.usesCustomCSS()) {
			element.customCSSRadioButton.click();
		} else {
			element.colorPickerRadioButton.click();
		}

		update();
	});

	// Update copyright year
	element.year.textContent = String(new Date().getFullYear());
}

/**
 * Updates the view
 */
function update() {
	chrome.runtime.getBackgroundPage(background => {
		const ExtensionOptions = background.ExtensionOptions;

		const className = element.CSSClassNameInput.value.trim();
		const valid = ExtensionOptions.isValidCSSClassName(className);

		element.CSSClassNameInput.classList.toggle('text-input--invalid', !valid);
		element.CSSClassNameInput.textContent = className;
		element.CSSClassName.textContent = className;
		element.clearChildrenInput.disabled = !element.clearCommentInput.checked;
		element.linkColorPicker.disabled = !element.customLinkColor.checked;
		element.linkNightColorPicker.disabled = !element.customLinkColor.checked;
		element.quoteTextColorPicker.disabled = !element.customQuoteColor.checked;
		element.quoteTextNightColorPicker.disabled = !element.customQuoteColor.checked;

		// Update visible page/tab
		const selection = document.querySelector('input[name="style-mode"]:checked');

		for (const tab of element.tabs) {
			tab.classList.toggle('main-content__tab--is-visible', tab.classList.contains(selection.id));
		}

		// Update frequency values
		const frequencyValue = element.frequencyInput.value;

		switch (parseInt(frequencyValue, 10)) {
			case 1:
				element.frequencyNumber.textContent = 1;
				element.frequencyUnit.textContent = 'day';
				break;
			case 7:
				element.frequencyNumber.textContent = 1;
				element.frequencyUnit.textContent = 'week';
				break;
			case 14:
				element.frequencyNumber.textContent = 2;
				element.frequencyUnit.textContent = 'weeks';
				break;
			default:
				element.frequencyNumber.textContent = frequencyValue;
				element.frequencyUnit.textContent = 'days';
		}

		element.RESDialog.classList.toggle('options-section--hidden', state.showResSettings !== null);
		for (const setting of element.RESSettings) {
			setting.classList.toggle('options-section--hidden', !state.showResSettings);
		}

		element.advancedDialog.classList.toggle('options-section--hidden', state.showAdvancedSettings);
		for (const setting of element.advancedSettings) {
			setting.classList.toggle('options-section--hidden', !state.showAdvancedSettings);
		}

		// Show contents
		element.content.classList.remove('main-content--hidden');
	});
}

document.addEventListener('DOMContentLoaded', initialize);
