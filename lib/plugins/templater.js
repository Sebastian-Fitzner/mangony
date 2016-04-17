'use strict';

var Promise = require('bluebird');
var handlebars = require('handlebars');
var Helpers = require('../utils/helpers');
var fsx = Promise.promisifyAll(require('fs-extra'));


class Templater {
	constructor(opts) {

		this.initialize();
	}

	initialize() {

	}

	/**
	 * Render all pages.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.repository - Repository array of pages
	 * @param {Object} obj.pages - Cache object of pages
	 * @param {Object} obj.data - Cache object of data
	 * @param {Object} obj.ext - Extension of page
	 * @param {Object} obj.dist - Destination path of page
	 *
	 * @public
	 */
	renderAll(obj) {
		return Promise.map(obj.repository, (name) => {
			let pageFile = obj.pages[name];
			return this.renderOne({
				content: pageFile.parsed.content,
				pageData: pageFile.parsed.data,
				file: pageFile.file,
				data: obj.data,
				ext: obj.ext,
				dist: obj.dist
			});
		});
	}

	/**
	 * Render single page.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.content - Page content
	 * @param {Object} obj.pageData - Cache page data object
	 * @param {Object} obj.data - Cache data object
	 * @param {Object} obj.dist - Destination path
	 * @param {Object} obj.file - Filename of page
	 * @param {Object} obj.ext - Extension of page
	 *
	 * @public
	 */
	renderOne(obj) {
		let template = handlebars.compile(obj.content);

		return Helpers.write(obj.dist + '/' + obj.file + obj.ext, template(Helpers.extend(obj.data, obj.pageData)));
	}
}

module.exports = Templater;