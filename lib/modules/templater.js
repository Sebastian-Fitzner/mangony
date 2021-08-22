/**
 * Represents a Templater plugin.
 * @module Templater
 *
 * @author Sebastian Fitzner
 */

'use strict';

const chalk = require('chalk');
const Promise = require('bluebird');
const Helpers = require('../utils/helpers');

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

	initialize() {}

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
			let pageFile = obj.pages[ name ];

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
		if(!obj.page) return;

		let pageSrcExt = obj.page.srcExt || '';
		let pageContent = obj.page.parsed.content;
		let globalData = obj.cache ? Object.assign({}, obj.cache) : {};
		let pageData = globalData && globalData[ `${obj.page.filename}.settings` ] ? Object.assign(globalData[ `${obj.page.filename}.settings` ], obj.page.parsed.data) : obj.page.parsed.data || {};
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
				basename: obj.page.basename || '',
				destFile: destFile,
				dirname: obj.page.dirname || '',
				filename: obj.page.filename || '',
				id: obj.page.id,
				serverFile: obj.page.serverFile || ''
			}
		});

		if (this.options.allow.YFMContextData && globalData[ pageData.contextData ]) {
			data = Helpers.extend(data, obj.cache[ pageData.contextData ]);
		}

		if (this.options.allow.YFMLayout && pageData.publish === false) {
			console.info(chalk.yellow('Mangony :: Templater - File ' + chalk.cyan(obj.page.filename) + ' is not generated!'));
			return;
		}

		if (this.options.allow.YFMLayout && globalData.__layouts && pageData.layout) {
			if (!globalData.__layouts[ pageData.layout ]) {
				return console.error(chalk.yellow('Mangony :: Templater - No layout found!'));
			}

			let layoutFile = globalData.__layouts[ pageData.layout ].parsed.content;

			pageContent = layoutFile.replace(/\{\{\{yield\}\}\}/gi, pageContent);
		}

		return this.renderTemplate({
			page: obj.page,
			pageContent,
			data
		})
			.then((content) => {
			if (this.options.compileStaticFiles) {
				return Helpers.write(destDir + destFile, content);
			} else {
				return content;
			}
		});
	}

	renderTemplate() {
		console.log('Mangony :: Templater - You need to override renderTemplate().');

		return Promise.resolve(this);
	}

	/**
	 * Render all pages by using cache
	 */
	renderPages() {
		return this.renderAll({
			repository: this.context.data.cache.__repository.pages,
			pages: this.context.data.cache.pages,
			cache: this.context.data.cache
		});
	}

	/**
	 * Time starting of compiling
	 */
	preRenderPages() {
		console.time(`Compiling all files in: `);
		console.log(chalk.cyan(chalk.bold('\n*** Compiling started ... ***\n')));
	}

	/**
	 * Time ending of compiling
	 */
	postRenderPages() {
		console.log(chalk.cyan(chalk.bold('\n*** Compiling successful! ***\n')));
		console.time(`Compiling all files in: `);
	}
}

module.exports = Templater;
