import '../css/OptionsPage.scss';
import ColorPicker from 'simple-color-picker';

/**
 * Class consisting of relevant methods for the options page
 * @class
 */
class OptionsPage {
	// TODO redo EEVVERRYYYTHIIINNNNGGG
	$customCSSTextArea;
	$customCSSClassName;
	$border;
	$frequency;
	backgroundColorPicker;
	textColorPicker;

	constructor() {
		this.$customCSSTextArea = document.querySelector('textarea[name="css"]');
		this.$customCSSClassName = document.querySelector('input[name="class-name"]');
		this.$border = document.querySelector('input[name="border"]');
		this.$frequency = document.querySelector('input[name="frequency"]');

		this.update();
	}

	/**
	 * Saves the current options to chrome storage
	 */
	save() {
		chrome.runtime.getBackgroundPage(background => {
			const ExtensionOptions = background.ExtensionOptions;

			ExtensionOptions
				.setBackgroundColor(this.backgroundColorPicker.getHexString())
				.setTextColor(this.textColorPicker.getHexString())
				.setThreadRemovalSeconds(this.$frequency.value * 86400)
				.setBorder(this.$border.checked)
				.setCustomCSS(document.getElementById('use-custom-css').checked ? this.$customCSSTextArea.value : '')
				.setCustomCSSClassName(this.$customCSSClassName.value);

			ExtensionOptions.save().then(() => {
				this.showMessage('Settings saved!');
			});
		});
	}

	/**
	 * Resets the options in storage and view
	 */
	reset() {
		chrome.runtime.getBackgroundPage(background => {
			const ThreadStorage = background.ThreadStorage;
			const ChromeStorage = background.ChromeStorage;

			ThreadStorage.onChange.once(this.update.bind(this));

			ChromeStorage.clear().then(() => {
				this.showMessage('Settings reset!');
			});
		});
	}

	/**
	 * Updates the view
	 */
	update() {
		chrome.runtime.getBackgroundPage(background => {
			const ExtensionOptions = background.ExtensionOptions;

			const usesCustomCSS = ExtensionOptions.usesCustomCSS();
			document.getElementById(usesCustomCSS ? 'use-custom-css' : 'use-color-picker').click();

			// have to create color pickers when relevant tab is visible, or else they will break
			if (!usesCustomCSS && (!this.backgroundColorPicker || !this.textColorPicker)) {
				this.createColorPickers();
			}

			// if (this.backgroundColorPicker && this.textColorPicker) {
			// 	const backColor = ExtensionOptions.getBackgroundColor();
			// 	this.backgroundColorPicker.setColor(backColor);
			//
			// 	const frontColor = ExtensionOptions.getTextColor();
			// 	this.textColorPicker.setColor(frontColor);
			// }

			this.$customCSSTextArea.value = ExtensionOptions.getCustomCSS();
			this.$customCSSClassName.value = ExtensionOptions.getCustomCSSClassName();
			this.$customCSSClassName.dispatchEvent(new Event('input'));

			const seconds = ExtensionOptions.getThreadRemovalTimeSecs();
			this.$frequency.value = seconds / 86400;
			this.$frequency.dispatchEvent(new Event('input'));

			this.$border.checked = ExtensionOptions.hasBorder();
		});
	}

	/**
	 * Creates color pickers and appends them to the DOM
	 */
	createColorPickers() {
		this.backgroundColorPicker = new ColorPicker({
			el: document.getElementById('back-color'),
			background: '#ccc',
			width: 300,
			height: 150
		});

		this.textColorPicker = new ColorPicker({
			el: document.getElementById('front-color'),
			background: '#ccc',
			width: 300,
			height: 150
		});
	}

	/**
	 * Updates class-name fields
	 */
	updateClassNames() {
		chrome.runtime.getBackgroundPage(background => {
			const ExtensionOptions = background.ExtensionOptions;

			let className = this.$customCSSClassName.value.trim();
			const invalid = !ExtensionOptions.isValidCSSClassName(className);

			if (invalid) {
				className = ExtensionOptions.getDefaultCSSClassName();
			}

			this.$customCSSClassName.classList.toggle('invalid', invalid);
			document.querySelector('.class-name').textContent = className;
		});
	}

	/**
	 * Shows a message
	 * @param {string} message to display
	 */
	showMessage(message) {
		const $statusArea = document.getElementById('status-message');

		$statusArea.textContent = message;

		$statusArea.classList.add('visible');

		if (this.messageTimeOutId) {
			clearTimeout(this.messageTimeOutId);
		}

		this.messageTimeOutId = setTimeout(() => {
			$statusArea.classList.remove('visible');
		}, 2000);
	}
}

window.addEventListener('load', () => {
	const options = new OptionsPage();

	document.querySelector('input[name="save-options"]')
		.addEventListener('click', options.save.bind(options));
	document.querySelector('input[name="clear-options"]')
		.addEventListener('click', options.reset.bind(options));
	document.querySelector('input[name="class-name"]')
		.addEventListener('input', options.updateClassNames.bind(options));

	const $frequency = document.querySelector('input[name="frequency"]');

	$frequency.addEventListener('input', () => {
		const frequency = $frequency.value;
		const $frequencyNumber = document.getElementById('frequency-number');
		const $frequencyUnit = document.getElementById('frequency-unit');

		switch (parseInt(frequency, 10)) {
			case 1:
				$frequencyNumber.textContent = 1;
				$frequencyUnit.textContent = 'day';
				break;
			case 7:
				$frequencyNumber.textContent = 1;
				$frequencyUnit.textContent = 'week';
				break;
			case 14:
				$frequencyNumber.textContent = 2;
				$frequencyUnit.textContent = 'weeks';
				break;
			default:
				$frequencyNumber.textContent = frequency;
				$frequencyUnit.textContent = 'days';
		}
	});

	const styleModes = document.querySelectorAll('input[name="style-mode"]');

	for (const $styleMode of styleModes) {
		$styleMode.addEventListener('click', () => {
			// TODO move into update method
			const selection = $styleMode.value;
			const tabs = document.querySelectorAll('.tab');

			for (const tab of tabs) {
				tab.classList.toggle('hidden', tab.id !== selection);
			}
		});
	}

	document.getElementById('year').textContent = String(new Date().getFullYear());
});
