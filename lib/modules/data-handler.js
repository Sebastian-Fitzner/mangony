/**
 * Represents a data module to handle the caching of files.
 * @module data handler
 *
 * @author Sebastian Fitzner
 */

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
	 * Add to cache.
	 *
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
	 *
	 * @param {Object} obj - Object which contains multiple elements
	 * @param {String} obj.type - Type of element
	 * @param {String} obj.file - File, which will be used as ID
	 */
	deleteFromCache(obj) {
		var index = this.cache.repository[obj.type].indexOf(obj.file);

		delete this.cache[obj.type][obj.file];
		this.cache.repository[obj.type].splice(index, 1);
	}

	/**
	 * Replace file in cache by using deleteFromCache() and addToCache().
	 *
	 * @param {Object} obj - Object
	 */
	replaceInCache(obj) {
		this.deleteFromCache(obj);
		this.addToCache(obj);
	}
}

module.exports = DataHandler;