import Extension from './Extension';
import MiniSignal from 'mini-signals';

/**
 * Wrapper for browser storage
 * @class
 */
class Storage {
	/**
	 * @public
	 * @instance
	 * @readonly
	 * @type {MiniSignal}
	 */
	onChange = new MiniSignal();

	/**
	 * @private
	 * @instance
	 * @type {Type}
	 */
	type;

	/**
	 * @private
	 * @instance
	 * @type {StorageArea}
	 * @see {@link https://developer.chrome.com/extensions/storage#type-StorageArea} for definition and usage
	 */
	storage;

	/**
	 * Available storage types. SYNC will sync storage across devices.
	 * @public
	 * @static
	 * @readonly
	 * @enum {string}
	 */
	static Type = {
		LOCAL: 'local',
		SYNC: 'sync'
	};

	/**
	 * @constructor
	 * @param {Storage.Type} type
	 */
	constructor(type) {
		this.type = type;
		this.storage = Extension.storage[type];

		// Setup onChange listener
		Extension.storage.onChanged.addListener((changes, namespace) => {
			if (namespace !== this.type) {
				// Changes in wrong storage type
				return;
			}

			this.onChange.dispatch(changes);
		});
	}

	/**
	 * Max items stored
	 * @public
	 * @returns {number} max item limit
	 */
	get MAX_ITEMS() {
		return (this.storage.MAX_ITEMS || 512) - 1;
	}

	/**
	 * Max bytes stored
	 * @public
	 * @returns {number} max byte limit
	 */
	get MAX_BYTES() {
		return (this.storage.QUOTA_BYTES_PER_ITEM || 8192) - 20;
	}

	/**
	 * Gets an item by its' key
	 * This is an async operation
	 * @public
	 * @param {string} key of the item
	 * @returns {Promise} resolves on completion
	 */
	get(key) {
		return new Promise((resolve, reject) => {
			this.storage.get(key, data => {
				const error = Extension.runtime.lastError;

				if (error) {
					return reject(error);
				}

				resolve(data[key]);
			});
		});
	}

	/**
	 * Sets the value of a key
	 * This is an async operation
	 * @public
	 * @param {string} key
	 * @param {*} value
	 * @returns {Promise} resolves on completion
	 */
	set(key, value) {
		return new Promise((resolve, reject) => {
			this.storage.set({ [key]: value }, () => {
				const error = Extension.runtime.lastError;

				if (error) {
					return reject(error);
				}

				resolve();
			});
		});
	}

	/**
	 * Clears all, one or multiple keys, depending on provided arguments.
	 * This is an async operation
	 * @public
	 * @param {void|string[]|string} keys. Clears all keys if not defined.
	 * @returns {Promise} resolves on completion
	 */
	clear(keys) {
		return new Promise((resolve, reject) => {
			const callback = () => {
				const error = Extension.runtime.lastError;

				if (error) {
					reject(error);
				} else {
					resolve();
				}
			};

			if (arguments.length === 0) {
				this.storage.clear(callback);
			} else {
				keys = [].concat(keys); // Make sure it's an array
				this.storage.remove(keys, callback);
			}
		});
	}
}

// Only one instance of this class needed
export default new Storage(Storage.Type.SYNC);