/**
 * Represents a Mangony class which is used to generate HTML pages
 * with layouts, data files (JSON, HJSON, Markdown), partials and pages
 * by using Handlebars.
 *
 * TODO: Plugin ecosystem
 *
 * @module Mangony
 *
 * @author Sebastian Fitzner
 */

'use strict';

const chalk = require('chalk');
const DataHandler = require('./modules/data-handler');
const events = require('./utils/events');
const handlebars = require('handlebars');
const Helpers = require('./utils/helpers');
const loader = require('./modules/loader');
const path = require('path');
const Promise = require('bluebird');
const Templater = require('./plugins/templater');
const Watcher = require('./modules/watcher');

class Mangony {
	constructor(opts) {
		this.options = {
			exportData: true, // Export the complete data stack as JSON file
			cwd: false, // Set the current directory
			dest: 'test/expected', // Set the destination path
			types: { // All standard types should be defined in here
				data: { // Data type (JSON, HJSON)
					dir: '', // Directory of data files, will be used in watcher
					files: [] // Array of data files - globbing supported
				},
				partials: { // Partials type (hbs files)
					dir: '', // Directory of files - will be used in watcher
					files: [] // Array of files -  globbing supported
				},
				layouts: { // layouts type (hbs files)
					dir: '', // Directory of files - will be used in watcher
					files: [] // Array of files -  globbing supported
				},
				pages: { // pages type (hbs files)
					dir: '', // Directory of files - will be used in watcher
					files: [] // Array of files -  globbing supported
				}
				//custom: [
				//	{
				//		type: 'docs',
				//		dir: '',
				//		files: []
				//	}
				//]
			},
			helpers: false, // Custom helpers files - globbing supported (example: 'helpers/*.js')
			assets: '', // Assets directory
			flatten: false, // Flatten the destination directory
			ext: '.html', // Extension of destination files
			watch: false // Enable an own watcher instance for all types and fasten the compiling task
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

	/**
	 * Initialize Mangony instance and save references.
	 */
	initialize() {
		this.cwd = this.options.cwd.substr(this.options.cwd.length - 1) === '/' ? this.options.cwd : typeof this.options.cwd === 'string' ? this.options.cwd + '/' : '';
		this.dataHandler = new DataHandler();
		this.loader = loader;
		this.templater = new Templater();
		this.timeLogs = {
			getting: 'Got all files in',
			caching: 'Cached all files in',
			compiling: 'Compiled all files in',
			registering: 'Registered files in',
			finish: '\nMangony completed rendering in'
		};
		this.watchers = this.options.watch ? {} : null;
		this.dataFiles = null;
		this.layoutFiles = null;
		this.pageFiles = null;
		this.partialFiles = null;

		if (this.options.watch) this.bindEvents();

		this.preRenderTime();
	}

	/**
	 * Compile the complete stack by
	 * - getting all files (getAllFiles())
	 * - caching all files (cacheAllFiles())
	 * - registering helpers (templater)
	 * - registering partials (templater)
	 * - registering layouts (templater)
	 * - render all pages (renderAllPages()).
	 */
	compile() {
		return this.getAllFiles()
			.then(() => {
				console.timeEnd(this.timeLogs.getting);
				console.time(this.timeLogs.caching);

				if (this.options.watch) this.createWatchers();

				return this.cacheAllFiles();
			})
			.then(() => {
				console.timeEnd(this.timeLogs.caching);
				console.time(this.timeLogs.registering);
				return this.templater.registerHelpers(this.helperFiles);
			})
			.then(() => {
				return this.templater.registerPartials({
					repository: this.dataHandler.cache.repository.partials,
					partials: this.dataHandler.cache.partials
				});
			})
			.then(() => {
				return this.templater.registerPartials({
					repository: this.dataHandler.cache.repository.layouts,
					partials: this.dataHandler.cache.layouts
				});
			})
			.then(() => {
				console.timeEnd(this.timeLogs.registering);
				this.preRenderPages();

				if (this.options.exportData) {
					Helpers.write(this.cwd + 'exported/exported-data.json', JSON.stringify(this.dataHandler.cache, null, 2))
						.catch((err) => {
							console.warn(chalk.red('(!) The file could not be written: ', err));
						});
				}

				return this.renderPages();
			})
			.then(() => {
				this.postRenderPages();
				this.postRenderTime();
			})
			.catch((err) => {
				console.warn(chalk.red('\n(!) Files not compiled: ' + err));
			});
	}

	/**
	 * Bind all events for the watcher.
	 * This will only be used if this.options.watch === true.
	 */
	bindEvents() {
		// render single page
		let renderPage = (function (obj) {
			this.loader.readFile({
					path: obj.file,
					type: 'pages'
				})
				.then((data) => {
					this.preRenderTime();
					this.dataHandler.replaceInCache({
						type: 'pages',
						file: data.file,
						data: data
					});

					return this.dataHandler.cache.pages[data.file];
				})
				.then((fileData) => {
					this.preRenderPages();
					return this.renderPage(fileData);
				})
				.then(() => {
					this.postRenderPages();
					this.postRenderTime();
				})
				.catch(function (err) {
					console.log(chalk.red('(!) Error in rendering page: ', err));
				});
		}).bind(this);
		// Render pages when data was changed
		let renderPagesData = (function (obj) {
			this.loader.readFile({
					path: obj.file,
					type: 'data'
				})
				.then((data) => {
					this.preRenderTime();
					this.dataHandler.replaceInCache({
						type: 'data',
						file: data.file,
						data: data.parsed
					});

					return this.dataHandler.cache.data;
				})
				.then(() => {
					this.preRenderPages();
					return this.renderPages();
				})
				.then(() => {
					this.postRenderPages();
					this.postRenderTime();
				})
				.catch(function (err) {
					console.log(chalk.red('(!) Error in rendering pages: ', err));
				});
		}).bind(this);
		// Render all pages when layout was changed
		let renderPagesLyt = (function (obj) {
			this.loader.readFile({
					path: obj.file,
					type: 'layouts'
				})
				.then((data) => {
					this.preRenderTime();
					this.dataHandler.replaceInCache({
						type: 'layouts',
						file: data.file,
						data: data
					});

					return this.dataHandler.cache.layouts[data.file];
				})
				.then((data) => {
					return this.templater.registerPartial({
						file: data.file,
						template: data.parsed.content
					});
				})
				.then(() => {
					this.preRenderPages();
					return this.renderPages();
				})
				.then(() => {
					this.postRenderPages();
					this.postRenderTime();
				})
				.catch(function (err) {
					console.log(chalk.red('(!) Error in rendering pages: ', err));
				});
		}).bind(this);
		// Render all pages when partial was changed
		let renderPagesPartials = (function (obj) {
			this.loader.readFile({
					path: obj.file,
					type: 'partials'
				})
				.then((data) => {
					this.preRenderTime();
					this.dataHandler.replaceInCache({
						type: 'partials',
						file: data.file,
						data: data
					});

					return this.dataHandler.cache.partials[data.file];
				})
				.then((data) => {
					return this.templater.registerPartial({
						file: data.file,
						template: data.parsed.content
					});
				})
				.then(() => {
					this.preRenderPages();
					return this.renderPages();
				})
				.then(() => {
					this.postRenderPages();
					this.postRenderTime();
				})
				.catch(function (err) {
					console.log(chalk.red('(!) Error in rendering pages: ', err));
				});
		}).bind(this);

		events.registerEvent('pages:changed', renderPage);
		events.registerEvent('data:changed', renderPagesData);
		events.registerEvent('partials:changed', renderPagesPartials);
		events.registerEvent('layouts:changed', renderPagesLyt);
	}

	/**
	 * Get all files of types (pages, data, layouts, partials) by
	 * normalizing paths (buildPaths()) and using
	 * getFiles().
	 */
	getAllFiles() {
		console.time(this.timeLogs.getting);

		let pageFiles = this.buildPaths({
				dir: this.options.types.pages.dir,
				files: this.options.types.pages.files
			})
			.then((data) => {
				return this.getFiles(data);
			})
			.then((data) => {
				this.pageFiles = data;

				return data;
			});

		let dataFiles = this.buildPaths({
				dir: this.options.types.data.dir,
				files: this.options.types.data.files
			})
			.then((data) => {
				return this.getFiles(data);
			})
			.then((data) => {
				this.dataFiles = data;
				return data;
			});

		let partialFiles = this.buildPaths({
				dir: this.options.types.partials.dir,
				files: this.options.types.partials.files
			})
			.then((data) => {
				return this.getFiles(data);
			})
			.then((data) => {
				this.partialFiles = data;
				return data;
			});

		let layoutFiles = this.buildPaths({
				dir: this.options.types.layouts.dir,
				files: this.options.types.layouts.files
			})
			.then((data) => {
				return this.getFiles(data);
			})
			.then((data) => {
				this.layoutFiles = data;
				return data;
			});

		let helpersFiles = this.getFiles(this.cwd + this.options.helpers)
			.then((pages) => {
				this.helperFiles = pages;
				return pages;
			});

		return Promise
			.all([
				helpersFiles,
				pageFiles,
				dataFiles,
				partialFiles,
				layoutFiles
			])
			.then(() => {
				return console.log(chalk.green('OK: All files are saved!'));
			})
			.catch((err) => {
				console.log(chalk.red('(!) Error in caching all files: ', err));
			})
	}

	/**
	 * Get specific files by using this.loader. Globbing is supported.
	 *
	 * @see ./modules/loader.js
	 *
	 * @param {String} filepath - Filepath to file
	 *
	 * @return Promise with loaded files
	 */
	getFiles(filepath) {
		return new Promise(function (resolve) {
			let loading = loader.getFiles(filepath)
				.then((data) => {
					return data;
				})
				.catch(function (err) {
					console.log('Error in getting files: ', err);
				});

			resolve(loading);
		});
	}


	/**
	 * Cache all files (pages, data, partials, layouts) and return a new promise.
	 *
	 * @return Promise
	 */
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
				console.log(chalk.green('OK: All files are cached!'));
				return data;
			});
	}

	/**
	 * Cache multiple files.
	 *
	 * @param {Object} obj - Object
	 * @param {Array} obj.files - Array of files (with glob patterns)
	 * @param {Array} obj.type - Type of file
	 */
	cacheFiles(obj) {
		return Promise.map(obj.files, (file) => {
			return this.cacheFile({
				path: file,
				type: obj.type
			});
		});
	}

	/**
	 * Cache one single file.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.path - Path of the file
	 * @param {Object} obj.type - Type of the file
	 *
	 * @return Promise with data object of file
	 */
	cacheFile(obj) {
		return this.loader.readFile({
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
	}

	/**
	 * Render all pages by using cache
	 */
	renderPages() {
		return this.templater.renderAll({
			repository: this.dataHandler.cache.repository.pages,
			pages: this.dataHandler.cache.pages,
			data: this.dataHandler.cache.data,
			ext: this.options.ext,
			dest: this.options.dest
		});
	}

	/**
	 * Render one single page.
	 *
	 * @param {Object} fileData - Data object of file
	 */
	renderPage(fileData) {
		let pageFile = fileData;

		return this.templater.renderOne({
			content: pageFile.parsed.content,
			pageData: pageFile.parsed.data,
			file: pageFile.file,
			data: this.dataHandler.cache.data,
			dest: this.options.dest,
			ext: this.options.ext
		});
	}

	/**
	 * Time starting of compiling
	 */
	preRenderPages() {
		console.time(this.timeLogs.compiling);
		console.log(chalk.cyan(chalk.bold('\n*** Compiling started ... ***\n')));
	}

	/**
	 * Time ending of compiling
	 */
	postRenderPages() {
		console.log(chalk.cyan(chalk.bold('\n*** Compiling successful! ***\n')));
		console.timeEnd(this.timeLogs.compiling);
	}

	/**
	 * Time starting of complete rendering
	 */
	preRenderTime() {
		console.time(this.timeLogs.finish);
	}

	/**
	 * Time ending of complete rendering
	 */
	postRenderTime() {
		console.timeEnd(this.timeLogs.finish);
	}

	/**
	 * Build paths from options and returns an array.
	 *
	 * @param {Object} obj - Object
	 * @param {Object} obj.dir - Current directory for paths
	 * @param {Object} obj.files - File pattern in directory
	 *
	 * @return Array
	 */
	buildPaths(obj) {
		return Promise.map(obj.files, (file) => {
			return path.normalize(this.cwd + obj.dir + file);
		});
	}

	/**
	 * Create all watcher instances
	 */
	createWatchers() {
		this.watchers.partials = this.buildPaths({
				dir: this.options.types.partials.dir,
				files: this.options.types.partials.files
			})
			.then((files) => {
				new Watcher({
					type: 'partials',
					dir: files
				});
			});

		this.watchers.layouts = this.buildPaths({
				dir: this.options.types.layouts.dir,
				files: this.options.types.layouts.files
			})
			.then((files) => {
				new Watcher({
					type: 'layouts',
					dir: files
				});
			});

		this.watchers.pages = this.buildPaths({
				dir: this.options.types.pages.dir,
				files: this.options.types.pages.files
			})
			.then((files) => {
				new Watcher({
					type: 'pages',
					dir: files
				});
			});

		this.watchers.data = this.buildPaths({
				dir: this.options.types.data.dir,
				files: this.options.types.data.files
			})
			.then((files) => {
				new Watcher({
					type: 'data',
					dir: files
				});
			});
	}
}

module.exports = Mangony;