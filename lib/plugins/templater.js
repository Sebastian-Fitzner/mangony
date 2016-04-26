/**
 * Represents a Templater plugin.
 * @module Templater
 *
 * @author Sebastian Fitzner
 */

'use strict';

const Promise = require('bluebird');
const handlebars = require('handlebars');
const layouts = require('handlebars-layouts');
const helpers = require('handlebars-helpers')({
	handlebars: handlebars
});
const path = require('path');
const Helpers = require('../utils/helpers');

class Templater {
	constructor(opts) {

		this.initialize();
	}

	get engine() {
		return this._engine;
	}

	set engine(engine) {
		this._engine = engine;
	}

	initialize() {
		this.engine = handlebars;
		layouts.register(this.engine);
	}

	/**
	 * Render all pages.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.repository - Repository array of pages
	 * @param {Object} obj.pages - Cache object of pages
	 * @param {Object} obj.data - Cache object of data
	 * @param {Object} obj.ext - Extension of page
	 * @param {Object} obj.dest - Destination path of page
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
				dest: obj.dest
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
	 * @param {Object} obj.dest - Destination path
	 * @param {Object} obj.file - Filename of page
	 * @param {Object} obj.ext - Extension of page
	 *
	 * @public
	 */
	renderOne(obj) {
		let template = this.engine.compile(obj.content);

		return Helpers.write(obj.dest + '/' + obj.file + obj.ext, template(Helpers.extend(obj.data, obj.pageData)));
	}

	/**
	 * Register multiple partials.
	 *
	 * @param {Object} obj - Object
	 * @param {Array} obj.repository - Object
	 * @param {Object} obj.partials - Object
	 *
	 * @return Promise (all partials)
	 */
	registerPartials(obj) {
		return Promise.map(obj.repository, (name) => {
			let partialFile = obj.partials[name];
			return this.registerPartial({
				file: partialFile.file,
				template: partialFile.parsed.content
			});
		});
	}

	/**
	 * Register one single partial.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.file - The partial file
	 * @param {Object} obj.template - The partial content of the file
	 *
	 * @return Promise with registered partial
	 */
	registerPartial(obj) {
		return new Promise((resolve) => {
			let registerPartial = this.engine.registerPartial(obj.file, obj.template);

			resolve(registerPartial);
		});
	}

	/**
	 * Register all helpers.
	 *
	 * @param {Array} helpers - Array of helpers
	 *
	 * @return Promise
	 */
	registerHelpers(helpers) {
		return Promise.map(helpers, (helper) => {
			return this.registerHelper({
				file: helper
			});
		});
	}

	/**
	 * Register one single helper.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.file - Heloer file
	 *
	 * @return Promise
	 */
	registerHelper(obj) {
		return new Promise((resolve) => {
			let helper = require(path.resolve(obj.file));
			let registerHelper;

			if (helper.register) {
				registerHelper = this.engine.registerHelper(helper.register(handlebars));
			}

			resolve(registerHelper);
		});
	}

	//resolveRegistering(helper) {
	//	if (helper && helper.register !== undefined) {
	//		return helper.register(handlebars);
	//	}
	//
	//	if (helper) {
	//
	//	}
	//
	//}
}

module.exports = Templater;