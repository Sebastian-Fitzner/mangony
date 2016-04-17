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
	 * @param {Object} obj.cache - Cache object of pages
	 * @param {Object} obj.ext - Extension of page
	 * @param {Object} obj.dist - Destination path of page
	 *
	 * @public
	 */
	renderAll(obj) {
		return Promise.map(obj.cache, (page) => {
			return this.renderOne({
				content: page.data.parsed.content,
				data: page.data.parsed.data,
				file: page.data.file,
				ext: obj.ext,
				dist: obj.dist
			});
		});
	}

	renderOne(obj) {
		let template = handlebars.compile(obj.content);

		return Helpers.write(obj.dist + '/' + obj.file + obj.ext, template(Helpers.extend({}, obj.data)));
	}
}

module.exports = Templater;