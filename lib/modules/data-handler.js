'use strict';


class DataHandler {
	constructor() {
		this.cache = {
			repository: {
				layouts: [],
				pages: [],
				partials: [],
				panels: [],
				data: []
			},
			layouts: {},
			pages: {},
			partials: {},
			data: {},
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
		this.cache[obj.type][obj.file] = obj.data;
		this.cache.repository[obj.type].push(obj.file);
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