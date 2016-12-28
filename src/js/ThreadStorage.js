import ExtensionOptions from './ExtensionOptions';
import ChromeStorage from './ChromeStorage';
import { currentTimestampSeconds } from './TimeUtils';
import MiniSignal from 'mini-signals';

/**
 * Wrapper for chrome storage for getting and saving reddit thread history
 * @class
 */
class ThreadStorage {
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
	static STORAGE_KEY = 'reddit_au_threads';

	/**
	 * @private
	 * @instance
	 * @type {{id: string, timestamp: number}[]}
	 */
	collection = [];

	/**
	 * @constructor
	 */
	constructor() {
		// listen for changes in storage and update internal storage
		ChromeStorage.onChange.add(changes => {
			changes = changes[ThreadStorage.STORAGE_KEY];

			if (changes === undefined) {
				// no changes in thread history
				return;
			}

			this.collection = changes.newValue || [];

			this.onChange.dispatch();
		});

		// sync internal storage with chrome storage
		ChromeStorage.get(ThreadStorage.STORAGE_KEY).then(data => {
			this.collection = data || [];
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
	 * Gets a thread object by id
	 * @public
	 * @param {string} id
	 * @returns {{id: string, timestamp: number}|null} thread object, null if not present
	 */
	getById(id) {
		const i = this.getIndex(id);

		if (i > -1) {
			return this.collection[i];
		}

		return null;
	}

	/**
	 * Gets a thread objects' index by id
	 * @public
	 * @param {string} id
	 * @returns {number} index
	 */
	getIndex(id) {
		for (let i = 0; i < this.collection.length; i++) {
			const thread = this.collection[i];

			if (thread.id === id) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Gets the oldest thread object in storage
	 * @public
	 * @returns {{id: string, timestamp: number}|null} thread object, null if storage is empty
	 */
	getOldest() {
		if (this.collection.length === 0) {
			return null;
		}

		// array is sorted
		return this.collection[0];
	}

	/**
	 * Adds a thread to storage
	 * @public
	 * @param {string} id
	 * @returns {ThreadStorage} this instance for chaining purposes
	 */
	add(id) {
		this.cleanup();
		this.remove(id);

		this.collection.push({
			id,
			timestamp: currentTimestampSeconds()
		});

		return this;
	}

	/**
	 * Cleans up storage in case it's over capacity
	 * @public
	 */
	cleanup() {
		if (!this.collection.length) {
			return;
		}

		while (this.isOverMaxItemsLimit() || this.isOverMaxThreadAgeLimit() || this.isOverMaxByteLimit()) {
			this.remove(this.getOldest().id);
		}
	}

	/**
	 * Removes a thread in storage if it exists
	 * @public
	 * @param {string} id
	 * @returns {ThreadStorage} this instance for chaining purposes
	 */
	remove(id) {
		const i = this.getIndex(id);

		if (i > -1) {
			this.collection.splice(i, 1);
		}

		return this;
	}

	/**
	 * Checks whether storage is over chromes max item limit
	 * @public
	 * @returns {boolean} is over max items limit
	 */
	isOverMaxItemsLimit() {
		return this.collection.length >= ChromeStorage.MAX_ITEMS;
	}

	/**
	 * Checks whether the oldest thread is older than the extensions max time limit
	 * @public
	 * @returns {boolean} is over age limit
	 */
	isOverMaxThreadAgeLimit() {
		return this.getOldest().timestamp < (currentTimestampSeconds() - ExtensionOptions.getThreadRemovalTimeSecs());
	}

	/**
	 * Checks whether storage is over chromes max byte limit
	 * @public
	 * @returns {boolean} is over max byte limit
	 */
	isOverMaxByteLimit() {
		// assume every character is two bytes
		return JSON.stringify(this.collection).length * 2 >= ChromeStorage.MAX_BYTES;
	}

	/**
	 * Saves internal thread storage to browser storage. This is an async operation, hence the promise.
	 * @public
	 * @returns {Promise}
	 */
	save() {
		return ChromeStorage.set(ThreadStorage.STORAGE_KEY, this.collection).catch(this.onError.bind(this));
	}

	/**
	 * Clears the thread storage. This is an async operation, hence the promise.
	 * @public
	 * @returns {Promise}
	 */
	clear() {
		this.collection = [];
		return this.save();
	}
}

// only one instance of this class needed
export default new ThreadStorage();
