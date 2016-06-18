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
const path = require('path');
const md = require('markdown-it')({
	html: true,
	linkify: true,
	typographer: true
});
const mda = require('markdown-it-attrs');
const mdnh = require('markdown-it-named-headers');
const chalk = require('chalk');
const Helpers = require('../utils/helpers');
const mgyHelpers = require('mangony-hbs-helpers');
const mgyHelperWrapWith = require('mangony-hbs-helper-wrap-with');

class Templater {
	constructor(opts) {
		this.options = {
			allow: {
				YFMLayout: false,
				YFMContextData: false
			},
			compileStaticFiles: true
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

		md.use(mdnh).use(mda);

		require('handlebars-helpers')({handlebars: this.engine});
		layouts.register(this.engine);
		mgyHelpers.register(this.engine);
		mgyHelperWrapWith.register(this.engine);
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
		if (obj.repository.length <= 0) {
			console.warn(chalk.red('There are no pages to compile! Please make sure the path to your pages is set correctly.'));
		}

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
		let pageSrcExt = obj.page.srcExt;
		let pageContent = obj.page.parsed.content;
		let pageData = obj.page.parsed.data || {};
		let globalData = obj.cache ? Object.assign({}, obj.cache) : {};
		let destFile = obj.page.destFile;
		let destDir = obj.page.destDir;
		let assets = obj.page.assets;
		let data = Helpers.extend(globalData, pageData);
		let page = pageContent;
		let template;
		let content;

		data = Helpers.extend(data, {
			assets: assets,
			currentPage: {
				filename: obj.page.filename,
				basename: obj.page.basename,
				destFile: destFile,
				serverFile: obj.page.serverFile,
				dirname: obj.page.dirname,
				id: obj.page.id
			}
		});

		if (this.options.allow.YFMContextData && globalData[pageData.contextData]) {
			data = Helpers.extend(data, obj.cache[pageData.contextData]);
		}

		if (this.options.allow.YFMLayout && pageData.publish === false) {
			console.info(chalk.yellow('File ' + chalk.cyan(obj.page.filename) + ' is not generated!'));
			return;
		}

		if (this.options.allow.YFMLayout && globalData.__layouts && pageData.layout) {
			if (!globalData.__layouts[pageData.layout]) {
				return console.error(chalk.yellow('No layout found!'));
			}

			let layoutFile = globalData.__layouts[pageData.layout].parsed.content;

			page = layoutFile.replace(/\{\{\{yield\}\}\}/gi, pageContent);
		}

		if (!pageSrcExt) {
			return console.error(chalk.red('(!) pageExt is not defined!'));
		}

		template = this.engine.compile(page);
		content = pageSrcExt === '.md' ? md.render(template(data)) : template(data);

		if (this.options.compileStaticFiles) {
			return Helpers.write(destDir + destFile, content);
		} else {
			return content;
		}
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
				registerHelper = this.engine.registerHelper(helper.register(handlebars, this.options));
			}

			resolve(registerHelper);
		});
	}
}

module.exports = Templater;