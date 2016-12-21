import { Options } from './Options';
import { Storage } from './Storage';
import { currentTimestampSeconds } from './utils';

class ThreadStorage {
	static STORAGE_KEY = 'reddit_au_threads';
	collection = [];

	constructor() {
		// Storage.onChange.add(this.refresh.bind(this));
	}

	onError(error) {
		console.warn('Error: ', error);
	}

	refresh() {
		return new Promise(resolve => {
			Storage.get(ThreadStorage.STORAGE_KEY).then(data => {
				this.collection = data || [];

				resolve();
			}).catch(this.onError);
		});
	}

	getById(id) {
		const i = this.getIndex(id);

		if (i > -1) {
			return this.collection[i];
		}

		return null;
	}

	getIndex(id) {
		for (let i = 0; i < this.collection.length; i++) {
			const thread = this.collection[i];

			if (thread.id === id) {
				return i;
			}
		}

		return -1;
	}

	getOldest() {
		return this.collection[0];
	}

	add(id) {
		this.cleanup();
		this.remove(id);

		this.collection.push({
			id,
			timestamp: currentTimestampSeconds()
		});

		this.save(this.collection);
	}

	cleanup() {
		if (!this.collection.length) {
			return;
		}

		while (this.isOverMaxItemsLimit() || this.isOverMaxThreadAgeLimit() || this.isOverMaxByteLimit()) {
			this.remove(this.getOldest().id);
		}
	}

	remove(id) {
		const i = this.getIndex(id);

		if (i > -1) {
			this.collection.splice(i, 1);
		}
	}

	isOverMaxItemsLimit() {
		return this.collection.length >= Storage.MAX_ITEMS;
	}

	isOverMaxThreadAgeLimit() {
		return this.getOldest().timestamp < (currentTimestampSeconds() - Options.getThreadRemovalTimeSecs());
	}

	isOverMaxByteLimit() {
		// Assume every character is two bytes
		return JSON.stringify(this.collection).length * 2 >= Storage.MAX_BYTES;
	}

	save(collection) {
		return Storage.set(ThreadStorage.STORAGE_KEY, collection).catch(this.onError);
	}

	clear() {
		return this.save({});
	}
}

const threadStorage = new ThreadStorage();

export { threadStorage as ThreadStorage };
