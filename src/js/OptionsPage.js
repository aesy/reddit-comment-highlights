import '../css/OptionsPage.scss';
import ColorPicker from 'simple-color-picker';

/**
 * Collection of commonly used DOM Elements
 * @type {object<string, Element|ColorPicker>}
 */
const element = {
	CSSTextArea: document.querySelector('textarea[name="css"]'),
	CSSClassNameInput: document.querySelector('input[name="class-name"]'),
	CSSClassName: document.querySelector('.class-name'),
	borderInput: document.querySelector('input[name="border"]'),
	frequencyInput: document.querySelector('input[name="frequency"]'),
	frequencyNumber: document.getElementById('frequency-number'),
	frequencyUnit: document.getElementById('frequency-unit'),
	redirectInput: document.querySelector('input[name="redirect"]'),
	colorPickerRadioButton: document.getElementById('use-color-picker'),
	customCSSRadioButton: document.getElementById('use-custom-css'),
	statusMessage: document.getElementById('status-message'),
	styleModes: document.querySelectorAll('input[name="style-mode"]'),
	saveButton: document.querySelector('input[name="save-options"]'),
	resetButton: document.querySelector('input[name="clear-options"]'),
	year: document.getElementById('year'),

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
	element.CSSClassNameInput.addEventListener('input', update);
	element.frequencyInput.addEventListener('input', update);

	for (const styleMode of element.styleModes) {
		styleMode.addEventListener('click', update);
	}
}

/**
 * Shows a message
 * @param {string} message to display
 */
const showMessage = (() => {
	let messageTimeOutId;

	return message => {
		element.statusMessage.textContent = message;
		element.statusMessage.classList.add('visible');

		if (messageTimeOutId) {
			clearTimeout(messageTimeOutId);
		}

		messageTimeOutId = setTimeout(() => {
			element.statusMessage.classList.remove('visible');
		}, 2000);
	};
})();

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
			.setRedirect(element.redirectInput.checked)
			.setCustomCSS(element.customCSSRadioButton.checked ? element.CSSTextArea.value : '')
			.setCustomCSSClassName(element.CSSClassNameInput.value);

		ExtensionOptions.save().then(() => {
			showMessage('Settings saved!');
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
			showMessage('Settings reset!');
		});
	});
}

/**
 * Loads the options in storage and updates view
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
		const valid = !ExtensionOptions.isValidCSSClassName(className);

		element.CSSClassNameInput.classList.toggle('invalid', !valid);
		element.CSSClassNameInput.textContent = className;
		element.CSSClassName.textContent = className;

		// update visible page/tab
		// const selection = styleMode.value; // TODO
		const selection = 'use-custom-css';
		const tabs = document.querySelectorAll('.tab');

		for (const tab of tabs) {
			tab.classList.toggle('hidden', tab.id !== selection);
		}

		// update frequency values
		switch (parseInt(element.frequencyInput.value, 10)) {
			case 1:
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
				element.frequencyUnit.textContent = 'days';
		}
	});
}

document.addEventListener('DOMContentLoaded', initialize);
