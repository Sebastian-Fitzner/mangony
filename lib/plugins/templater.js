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
const marked = require('marked');
const chalk = require('chalk');
const Helpers = require('../utils/helpers');

class Templater {
	constructor(opts) {
		this.options = {
			dest: false, // Set the destination path
			ext: false // Extension of destination files
		};

		this.options = opts;
		this.initialize();
	}

	// GETTER AND SETTER

	/**
	 * Return options
	 */
	get options() {
		return this._options;
	}

	/**
	 * Save options by merging default options with passed options
	 */
	set options(options) {
		this._options = Helpers.extend(this._options || {}, options);
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
	 * @param {Object} obj.cache - Cache object
	 * @param {Object} obj.repository - Page repository array
	 * @param {Object} obj.pages - Pages object in cache
	 *
	 * @public
	 */
	renderAll(obj) {
		return Promise.map(obj.repository, (name) => {
			let pageFile = obj.pages[name];
			return this.renderOne({
				page: pageFile,
				cache: obj.cache
			});
		});
	}

	/**
	 * Render single page.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.page - Page content
	 * @param {Object} obj.cache - Cache object
	 *
	 * @public
	 */
	renderOne(obj) {
		let pageExt = obj.page.ext;
		let pageContent = obj.page.parsed.content;
		let pageData = obj.page.parsed.data || {};
		let globalData = obj.cache && obj.cache.data ? obj.cache.data : {};
		let pageName = obj.page.filename;

		if (!pageExt) {
			return console.error(chalk.red('(!) pageExt is not defined!'));
		}

		let template = this.engine.compile(pageContent);
		let content = pageExt === '.md' ? marked(template(Helpers.extend(globalData, pageData))) : template(Helpers.extend(globalData, pageData));

		return Helpers.write(this.options.dest + '/' + pageName + this.options.ext, content);
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
				filename: partialFile.filename,
				template: partialFile.parsed.content
			});
		});
	}

	/**
	 * Register one single partial.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.filename - The partial file
	 * @param {Object} obj.template - The partial content of the file
	 *
	 * @return Promise with registered partial
	 */
	registerPartial(obj) {
		return new Promise((resolve) => {
			let registerPartial = this.engine.registerPartial(obj.filename, obj.template);

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
}

module.exports = Templater;