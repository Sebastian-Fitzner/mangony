/**
 * Represents a data module to handle the caching of data.
 * @module data
 *
 * @author Sebastian Fitzner
 */

'use strict';


class Data {
	constructor() {
		this.cache = {
			"__repository": {
				layouts: [],
				pages: [],
				partials: [],
				panels: [],
				data: []
			},
			"__layouts": {},
			"__partials": {},
			pages: {},
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
		let type = this.getCacheType(obj.type);

		if (obj.type === 'data') {
			this.cache[obj.id] = obj.data;
		} else {
			this.cache[type][obj.id] = obj.data;
		}

		this.cache.__repository[obj.type].push(obj.id);
	}

	/**
	 * Delete from cache.
	 *
	 * @param {Object} obj - Object which contains multiple elements
	 * @param {String} obj.type - Type of element
	 * @param {String} obj.id - File, which will be used as ID
	 */
	deleteFromCache(obj) {
		let index = this.cache.__repository[obj.type].indexOf(obj.id);
		let type = this.getCacheType(obj.type);


		if (obj.type === 'data') {
			delete this.cache[obj.id];
		} else {
			delete this.cache[type][obj.id];
		}

		this.cache.__repository[obj.type].splice(index, 1);
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

	getCacheType(type) {
		if (type !== 'pages' && type !== 'data') {
			return '__' + type;
		} else {
			return type;
		}
	}
}

module.exports = Data;