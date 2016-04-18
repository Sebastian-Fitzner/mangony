'use strict';
var Promise = require('bluebird');
var Helpers = require('./utils/helpers');
var Templater = require('./plugins/templater');
var DataHandler = require('./modules/data-handler');
var loader = require('./modules/loader');
var handlebars = require('handlebars');
var chalk = require('chalk');

class Mangony {
	constructor(opts) {
		this.options = {
			exportData: true,
			cwd: false,
			dist: 'test/expected',
			types: {
				data: [],
				partials: [],
				pages: [],
				layouts: [],
				custom: [
					{
						type: 'docs'
					}
				]
			},
			templateEngine: 'handlebars',
			assets: '',
			flatten: false,
			ext: '.html'
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

	initialize() {
		this.loader = loader;
		this.dataHandler = new DataHandler();
		this.templater = new Templater();
		this.cwd = this.options.cwd.substr(this.options.cwd.length - 1) === '/' ? this.options.cwd : typeof this.options.cwd === 'string' ? this.options.cwd + '/' : '';
		this.pageFiles = null;
		this.partialFiles = null;
		this.dataFiles = null;
		this.layoutFiles = null;

		this.getAllFiles();
	}

	getAllFiles() {
		let pageFiles = this.getFiles(this.cwd + this.options.types.pages).then((pages) => {
			this.pageFiles = pages;
			return pages;
		});
		let dataFiles = this.getFiles(this.cwd + this.options.types.data).then((data) => {
			this.dataFiles = data;
			return data;
		});
		let partialFiles = this.getFiles(this.cwd + this.options.types.partials).then((partials) => {
			this.partialFiles = partials;
			return partials;
		});
		let layoutFiles = this.getFiles(this.cwd + this.options.types.layouts).then((layouts) => {
			this.layoutFiles = layouts;
			return layouts;
		});

		Promise
			.all([
				pageFiles,
				dataFiles,
				partialFiles,
				layoutFiles
			])
			.then(() => {
				return this.cacheAllFiles();
			})
			.then(() => {
				return this.templater.registerPartials({
					repository: this.dataHandler.cache.repository.partials,
					partials: this.dataHandler.cache.partials
				});
			})
			.then(() => {
				this.compile();
			})
			.catch((err) => {
				console.log('ERROR in caching all files: ', err);
			})
	}

	getFiles(path) {
		return new Promise(function (resolve) {
			let loading = loader.getFiles(path)
				.then((data) => {
					return data;
				})
				.catch(function (err) {
					console.log('Error in getting files: ', err);
				});

			resolve(loading);
		});
	};

	cacheFile(obj) {
		return loader.readFile({
				path: obj.path,
				type: obj.type
			})
			.then((data) => {
				this.dataHandler.addToCache({
					type: obj.type,
					file: data.file,
					data: obj.type !== 'data' ? data : data.parsed
				});

				return this.dataHandler.cache[obj.type];
			})
			.catch(function (err) {
				console.log('Error in caching files: ', err);
			});
	};

	cacheFiles(obj) {
		return Promise.map(obj.files, (file) => {
			return this.cacheFile({
				path: file,
				type: obj.type
			});
		}).then(() => {
			return console.log(obj.type + ' are cached!');
		});
	}

	cacheAllFiles() {
		let pageCache = this.cacheFiles({
			files: this.pageFiles,
			type: 'pages'
		}).then((data) => {
			return data;
		});
		let partialCache = this.cacheFiles({
			files: this.partialFiles,
			type: 'partials'
		}).then((data) => {
			return data;
		});
		let layoutCache = this.cacheFiles({
			files: this.layoutFiles,
			type: 'layouts'
		}).then((data) => {
			return data;
		});
		let dataCache = this.cacheFiles({
			files: this.dataFiles,
			type: 'data'
		}).then((data) => {
			return data;
		});

		return Promise
			.all(
				[
					dataCache,
					pageCache,
					partialCache,
					layoutCache
				]
			)
			.then((data) => {
				return data;
			});
	}


	compile() {
		if (this.options.exportData) {
			Helpers.write(this.cwd + 'exported/exported-data.json', JSON.stringify(this.dataHandler.cache, null, 2))
				.catch((err) => {
					console.warn(chalk.red('ERROR: The file could not be written: ', err));
				});
		}

		console.log(chalk.yellow('\n*** Compiling started! ***\n'));

		this.templater
			.renderAll({
				data: this.dataHandler.cache.data,
				repository: this.dataHandler.cache.repository.pages,
				pages: this.dataHandler.cache.pages,
				ext: this.options.ext,
				dist: this.options.dist
			})
			.then(() => {
				console.log(chalk.green('\n*** Compiling successful! ***\n'));
			})
			.catch((err) => {
				console.warn(chalk.red('\nERROR: Files not compiled: ' + err));
			});
	}
}

module.exports = Mangony;