/**
 * Represents a data module to handle the caching of ids.
 * @module data
 *
 * @author Sebastian Fitzner
 */

'use strict';


class Data {
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
	 * @param {String} obj.id - File, which will be used as ID
	 * @param {Object} obj.data - Data object
	 */
	addToCache(obj) {
		this.cache[obj.type][obj.id] = obj.data;
		this.cache.repository[obj.type].push(obj.id);
	}

	/**
	 * Delete from cache.
	 *
	 * @param {Object} obj - Object which contains multiple elements
	 * @param {String} obj.type - Type of element
	 * @param {String} obj.id - File, which will be used as ID
	 */
	deleteFromCache(obj) {
		var index = this.cache.repository[obj.type].indexOf(obj.id);

		delete this.cache[obj.type][obj.id];
		this.cache.repository[obj.type].splice(index, 1);
	}

	/**
	 * Replace id in cache by using deleteFromCache() and addToCache().
	 *
	 * @param {Object} obj - Object
	 */
	replaceInCache(obj) {
		this.deleteFromCache(obj);
		this.addToCache(obj);
	}
}

module.exports = Data;