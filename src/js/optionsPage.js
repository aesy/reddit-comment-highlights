import '../css/page/options/module.scss';
import ColorPicker from 'simple-color-picker';

/**
 * Collection of commonly used DOM Elements
 * @type {object<string, Element|Element[]|ColorPicker>}
 */
const element = {
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
	saveButton: document.getElementById('save-options'),
	resetButton: document.getElementById('clear-options'),
	year: document.getElementById('footer__year'),

	// not actually DOM Elements...
	backgroundColorPicker: new ColorPicker({
		el: document.getElementById('back-color'),
		background: '#ccc',
		width: 300,
		height: 150
	}),
	textColorPicker: new ColorPicker({
		el: document.getElementById('front-color'),
		background: '#ccc',
		width: 300,
		height: 150
	})
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
	element.clearCommentInput.addEventListener('click', update);
	element.frequencyInput.addEventListener('input', update);
	element.CSSClassNameInput.addEventListener('input', () => {
		const selection = {
			start: element.CSSClassNameInput.selectionStart,
			end: element.CSSClassNameInput.selectionEnd
		};

		// this loses the selection of the input for some reason
		update();

		// restore selection (has to be async)
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

/**
 * Saves the current options to chrome storage
 */
function save() {
	chrome.runtime.getBackgroundPage(background => {
		const ExtensionOptions = background.ExtensionOptions;

		ExtensionOptions
			.setBackgroundColor(element.backgroundColorPicker.getHexString())
			.setTextColor(element.textColorPicker.getHexString())
			.setThreadRemovalSeconds(element.frequencyInput.value * 86400)
			.setBorder(element.borderInput.checked)
			.setClearComment(element.clearCommentInput.checked, element.clearChildrenInput.checked)
			.setRedirect(element.redirectInput.checked)
			.setCustomCSS(element.customCSSRadioButton.checked ? element.CSSTextArea.value : '')
			.setCustomCSSClassName(element.CSSClassNameInput.value);

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

		element.backgroundColorPicker.setColor(ExtensionOptions.getBackgroundColor());
		element.textColorPicker.setColor(ExtensionOptions.getTextColor());
		element.CSSTextArea.value = ExtensionOptions.getCustomCSS();
		element.CSSClassNameInput.value = ExtensionOptions.getCSSClassName();
		element.frequencyInput.value = ExtensionOptions.getThreadRemovalTimeSecs() / 86400;
		element.redirectInput.checked = ExtensionOptions.getRedirect();
		element.borderInput.checked = ExtensionOptions.hasBorder();
		element.clearCommentInput.checked = ExtensionOptions.getClearComment().atAll;
		element.clearChildrenInput.checked = ExtensionOptions.getClearComment().includeChildren;

		if (ExtensionOptions.usesCustomCSS()) {
			element.customCSSRadioButton.click();
		} else {
			element.colorPickerRadioButton.click();
		}

		update();
	});

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

		// update visible page/tab
		const selection = document.querySelector('input[name="style-mode"]:checked');

		for (const tab of document.querySelectorAll('.main-content__tab')) {
			tab.classList.toggle('main-content__tab--is-visible', tab.classList.contains(selection.id));
		}

		// update frequency values
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
	});
}

document.addEventListener('DOMContentLoaded', initialize);
