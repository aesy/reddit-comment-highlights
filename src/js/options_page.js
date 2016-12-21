import '../css/reddit-comment-highlights.scss';
import ColorPicker from 'simple-color-picker';

class OptionsPage {
	$customCSSTextArea;
	$customCSSClassName;
	$border;
	$frequency;
	backColorPicker;
	frontColorPicker;

	constructor() {
		this.$customCSSTextArea = document.querySelector('textarea[name="css"]');
		this.$customCSSClassName = document.querySelector('input[name="class-name"]');
		this.$border = document.querySelector('input[name="border"]');
		this.$frequency = document.querySelector('input[name="frequency"]');

		this.update();
	}

	save() {
		chrome.runtime.getBackgroundPage(background => {
			const promise = background.Options.save({
				backColor: this.backColorPicker.getHexString(),
				frontColor: this.frontColorPicker.getHexString(),
				threadRemovalTimeSeconds: this.$frequency.value * 86400,
				border: this.$border.checked,
				useCustomCSS: document.getElementById('use-custom-css').checked,
				customCSS: this.$customCSSTextArea.value,
				customCSSClassName: this.$customCSSClassName.value
			});

			promise.then(() => {
				this.showMessage('Okay, got it!');
			});
		});
	}

	reset() {
		chrome.runtime.getBackgroundPage(background => {
			background.Storage.clear().then(() => {
				this.update();
			});
		});
	}

	update() {
		chrome.runtime.getBackgroundPage(background => {
			const useCustomCSS = background.Options.useCustomCSS();
			document.getElementById(useCustomCSS ? 'use-custom-css' : 'use-color-picker').click();

			if (!this.backColorPicker || !this.frontColorPicker) {
				this.createColorPickers();
			}

			this.$customCSSTextArea.value = background.Options.getCustomCSS();

			this.$customCSSClassName.value = background.Options.getCustomCSSClassName();
			this.$customCSSClassName.dispatchEvent(new Event('input'));

			const backColor = background.Options.getBackColor();
			this.backColorPicker.setColor(backColor);

			const frontColor = background.Options.getFrontColor();
			this.frontColorPicker.setColor(frontColor);

			const seconds = background.Options.getThreadRemovalTimeSecs();
			this.$frequency.value = seconds / 86400;
			this.$frequency.dispatchEvent(new Event('input'));

			this.$border.checked = background.Options.hasBorder();
		});
	}

	createColorPickers() {
		this.backColorPicker = new ColorPicker({
			el: document.getElementById('back-color'),
			background: '#cccccc',
			width: 300,
			height: 150
		});

		this.frontColorPicker = new ColorPicker({
			el: document.getElementById('front-color'),
			background: '#cccccc',
			width: 300,
			height: 150
		});
	}

	updateClassNames() {
		chrome.runtime.getBackgroundPage(background => {
			let className = this.$customCSSClassName.value.trim();
			const invalid = !background.Options.isValidCSSClassName(className);

			if (invalid) {
				className = background.Options.getDefaultCSSClassName();
			}

			this.$customCSSClassName.classList.toggle('invalid', invalid);
			document.querySelector('.class-name').textContent = className;
		});
	}

	showMessage(message) {
		const $statusArea = document.getElementById('status-message');

		$statusArea.textContent = message;

		$statusArea.classList.add('visible');

		setTimeout(() => {
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
			const selection = $styleMode.value;
			const tabs = document.querySelectorAll('.tab');

			for (const tab of tabs) {
				tab.classList.toggle('hidden', tab.id !== selection);
			}
		});
	}

	document.getElementById('year').textContent = String(new Date().getFullYear());
});
