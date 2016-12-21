import { ThreadStorage } from './ThreadStorage';
import { Options } from './Options';

class Storage {
	storage;

	static TYPE = {
		LOCAL: 'local',
		SYNC: 'sync'
	};

	constructor(type) {
		this.storage = chrome.storage[type];
	}

	get MAX_ITEMS() {
		return this.storage.MAX_ITEMS - 1;
	}

	get MAX_BYTES() {
		return this.storage.QUOTA_BYTES_PER_ITEM - 20;
	}

	get(key) {
		return new Promise((resolve, reject) => {
			this.storage.get(key, data => {
				const error = chrome.runtime.lastError;

				if (error) {
					return reject(error);
				}

				resolve(data[key]);
			});
		});
	}

	set(key, value) {
		return new Promise((resolve, reject) => {
			this.storage.set({ [key]: value }, () => {
				const error = chrome.runtime.lastError;

				if (error) {
					return reject(error);
				}

				resolve();
			});
		});
	}

	clear() {
		return new Promise((resolve, reject) => {
			this.storage.clear(() => {
				const error = chrome.runtime.lastError;

				if (error) {
					return reject(error);
				}

				Options.refresh().then(() => {
					resolve();
				});

				ThreadStorage.refresh();
			});
		});
	}
}

const storage = new Storage(Storage.TYPE.SYNC);

export { storage as Storage };
