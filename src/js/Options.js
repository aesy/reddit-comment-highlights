import { Storage } from './Storage';

class Options {
	static STORAGE_KEY = 'reddit_au_options';
	options = {};

	constructor() {
		this.refresh();
	}

	onError(error) {
		console.warn('Error: ', error);
	}

	refresh() {
		return new Promise(resolve => {
			Storage.get(Options.STORAGE_KEY).then(data => {
				this.options = data || {};

				resolve();
			}).catch(this.onError);
		});
	}

	getAll() {
		return {
			border: this.getBorder(),
			hasBorder: this.hasBorder(),
			backColor: this.getBackColor(),
			frontColor: this.getFrontColor(),
			useCustomCSS: this.useCustomCSS(),
			customCSS: this.getCustomCSS(),
			customCSSClassName: this.getCustomCSSClassName(),
			defaultCSSClassName: this.getDefaultCSSClassName(),
			threadRemovalTimeSeconds: this.getThreadRemovalTimeSecs()
		};
	}

	getBorder() {
		return this.hasBorder() ? '1px dotted #CCCCCC' : '0';
	}

	hasBorder() {
		return this.options.border === undefined ? true : Boolean(this.options.border);
	}

	getBackColor() {
		return this.options.backColor || '#FFFDCC';
	}

	getFrontColor() {
		return this.options.frontColor || '#000000';
	}

	useCustomCSS() {
		return this.options.useCustomCSS || false;
	}

	getCustomCSS() {
		return this.options.customCSS || '';
	}

	getCustomCSSClassName() {
		const className = this.options.customCSSClassName;
		const valid = className && this.isValidCSSClassName(className);

		return valid ? className : this.getDefaultCSSClassName();
	}

	getDefaultCSSClassName() {
		return 'highlight';
	}

	getThreadRemovalTimeSecs() {
		return this.options.threadRemovalTimeSeconds || 604800;
	}

	isValidCSSClassName(className) {
		return /^([a-z_]|-[a-z_-])[a-z\d_-]*$/i.test(className);
	}

	save(options) {
		this.options = options;
		return Storage.set(Options.STORAGE_KEY, options).catch(this.onError);
	}

	clear() {
		return this.save({});
	}
}

const options = new Options();

export { options as Options };
