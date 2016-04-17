'use strict';


class DataHandler {
	constructor() {
		this.cache = {
			layouts: [],
			pages: [],
			partials: [],
			panels: [],
			data: [],
			customTypes: []
		};
	}

	/**
	 * GETTERS AND SETTERS
	 */
	get uid() {
		return this._uid;
	}

	set uid(uid) {
		this._uid = uid;
	}

	/**
	 * Add to cache.
	 * @param {Object} obj - Object which contains multiple elements
	 * @param {String} obj.type - Type of element
	 * @param {String} obj.file - File, which will be used as ID
	 * @param {Object} obj.data - Data object
	 */
	addToCache(obj) {
		this.cache[obj.type].push({file: obj.file, data: obj.data});
	}

	/**
	 * Delete from cache.
	 * @param {Object} obj - Object which contains multiple elements
	 * @param {String} obj.type - Type of element
	 * @param {String} obj.file - File, which will be used as ID
	 */
	deleteFromCache(obj) {
		this.cache[obj.type][obj.file] = {};
	}
}

module.exports = DataHandler;