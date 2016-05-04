/**
 * Represents a Mangony class which is used to generate HTML pages
 * with layouts, data files (JSON, HJSON, Markdown), partials and pages
 * by using Handlebars.
 *
 * TODO: Plugin ecosystem
 * TODO: Clean up
 *
 * @module Mangony
 *
 * @author Sebastian Fitzner
 */

'use strict';

const chalk = require('chalk');
const Data = require('./modules/data');
const events = require('./utils/events');
const handlebars = require('handlebars');
const Helpers = require('./utils/helpers');
const loader = require('./modules/loader');
const path = require('path');
const Promise = require('bluebird');
const Templater = require('./plugins/templater');
const Watcher = require('./modules/watcher');

global.Mangony = {
	platform: process.platform,
	debug: false
};

class Mangony {
	constructor(opts) {
		this.options = {
			exportData: true, // Export the complete data stack as JSON file
			cwd: false, // Set the current directory
			dest: 'app', // Set the destination path
			types: { // All standard types should be defined in here
				data: { // Data type (JSON, HJSON)
					createDeepIds: false, // Create custom IDs with sub directories included
					pathDelimiter: false, // Provide a custom delimiter for path slashes
					dir: '', // Directory of data files, will be used in watcher
					files: [] // Array of data files - globbing supported
				},
				partials: { // Partials type (hbs files)
					createDeepIds: false, // Create custom IDs with sub directories included
					pathDelimiter: false, // Provide a custom delimiter for path slashes
					dir: '', // Directory of files - will be used in watcher
					files: [] // Array of files -  globbing supported
				},
				layouts: { // layouts type (hbs files)
					createDeepIds: false, // Create custom IDs with sub directories included
					pathDelimiter: false, // Provide a custom delimiter for path slashes
					dir: '', // Directory of files - will be used in watcher
					files: [] // Array of files -  globbing supported
				},
				pages: { // pages type (hbs files)
					createDeepIds: true, // Create custom IDs with sub directories included
					pathDelimiter: false, // Provide a custom delimiter for path slashes
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
			compileStaticFiles: true,
			debug: false,
			watch: false // Enable an own watcher instance for all types
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
		this._options = Helpers.deepExtend(this._options || {}, options);
	}

	/**
	 * Initialize Mangony instance and save references.
	 */
	initialize() {
		if (!this.options.dest || typeof this.options.dest !== 'string') {
			return new Error('(!) You need to define a destination path as string!');
		}

		this.cwd = Helpers.endsWithSlash(this.options.cwd) ? this.options.cwd : this.options.cwd + '/';
		this.data = new Data();
		this.loader = loader;
		this.templater = new Templater({
			ext: this.options.ext,
			dest: this.options.dest
		});
		this.timeLogs = {
			getting: 'Got all files in',
			caching: 'Cached all files in',
			compiling: 'Compiled all files in',
			registering: 'Registered files in',
			finish: '\nMangony completed in'
		};
		this.watchers = this.options.watch ? {} : null;
		this.events = events;
		this.dataFiles = null;
		this.layoutsFiles = null;
		this.pagesFiles = null;
		this.partialsFiles = null;

		if (this.options.watch) this.bindEvents();
		if (this.options.debug) {
			global.Mangony.debug = true;
		}
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
		return this.prepareData()
			.then(() => {
				return this.prepareTemplates()
			})
			.then(() => {

				this.preRenderPages();

				if (this.options.exportData) {
					Helpers.write(this.cwd + 'exported/exported-data.json', JSON.stringify(this.data.cache, null, 2))
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

	prepareData() {
		return this.getAllFiles()
			.then(() => {
				console.timeEnd(this.timeLogs.getting);
				console.time(this.timeLogs.caching);

				return this.cacheAllFiles();
			})
			.then((data) => {
				console.timeEnd(this.timeLogs.caching);

				if (this.options.watch) this.createWatchers();

				return data;
			})
			.catch((err) => {
				console.warn(chalk.red('\n(!) Error in preparing files: ' + err));
			});
	}

	prepareTemplates() {
		console.time(this.timeLogs.registering);

		return this.templater.registerHelpers(this.helpersFiles)
			.then(() => {
				if (this.options.debug) console.info(chalk.yellow('DEBUG: Registering partials ...'));

				return this.templater.registerPartials({
					repository: this.data.cache.repository.partials,
					partials: this.data.cache.partials
				});
			})
			.then(() => {
				if (this.options.debug) console.info(chalk.yellow('DEBUG: Registering layouts ...'));

				return this.templater.registerPartials({
					repository: this.data.cache.repository.layouts,
					partials: this.data.cache.layouts
				});
			})
			.then((data) => {
				console.timeEnd(this.timeLogs.registering);

				return data;
			})
			.catch((err) => {
				console.warn(chalk.red('\n(!) Error in registering helpers and templates: ' + err));
			});
	};

	/**
	 * Bind all events for the watcher.
	 * This will only be used if this.options.watch === true.
	 */
	bindEvents() {
		// render single page
		let renderPage = (function (obj) {
			this.loader.readFile({
					srcPath: obj.file,
					typePath: this.cwd + this.options.types.pages.dir,
					type: 'pages',
					ext: this.options.ext,
					dest: this.options.dest,
					flatten: this.options.flatten,
					createDeepIds: this.options.types.pages.createDeepIds
				})
				.then((data) => {

					this.preRenderTime();
					this.data.replaceInCache({
						type: 'pages',
						id: data.id,
						data: data
					});

					return this.data.cache.pages[data.filename];
				})
				.then((fileData) => {
					if (this.options.compileStaticFiles) {
						this.preRenderPages();
						if (this.options.debug) console.info(chalk.yellow('DEBUG: Rendering single page ' + fileData.file + ' ...'));
						return this.renderPage(fileData);
					}
				})
				.then(() => {
					if (this.options.compileStaticFiles) {
						this.postRenderPages();
					}

					this.postRenderTime();
				})
				.catch(function (err) {
					console.log(chalk.red('(!) Error in rendering page: ', err));
				});
		}).bind(this);
		// Render pages when data was changed
		let renderPagesData = (function (obj) {
			this.loader.readFile({
					srcPath: obj.file,
					typePath: this.cwd + this.options.types.data.dir,
					type: 'data',
					ext: this.options.ext,
					dest: this.options.dest,
					flatten: this.options.flatten,
					createDeepIds: this.options.types.data.createDeepIds
				})
				.then((data) => {

					this.preRenderTime();
					this.data.replaceInCache({
						type: 'data',
						id: data.id,
						data: data.parsed
					});

					return this.data.cache.data;
				})
				.then(() => {
					if (this.options.compileStaticFiles) {
						if (this.options.debug) console.info(chalk.yellow('DEBUG: Rendering all pages ...'));

						this.preRenderPages();
						return this.renderPages();
					}
				})
				.then(() => {
					if (this.options.compileStaticFiles) {
						this.postRenderPages();
					}

					this.postRenderTime();
				})
				.catch(function (err) {
					console.log(chalk.red('(!) Error in rendering pages: ', err));
				});
		}).bind(this);
		// Render all pages when layout was changed
		let renderPagesLyt = (function (obj) {
			this.loader.readFile({
					srcPath: obj.file,
					typePath: this.cwd + this.options.types.layouts.dir,
					type: 'layouts',
					ext: this.options.ext,
					dest: this.options.dest,
					flatten: this.options.flatten,
					createDeepIds: this.options.types.layouts.createDeepIds
				})
				.then((data) => {
					this.preRenderTime();
					this.data.replaceInCache({
						type: 'layouts',
						id: data.id,
						data: data
					});

					return this.data.cache.layouts[data.filename];
				})
				.then((data) => {
					return this.templater.registerPartial({
						filename: data.filename,
						template: data.parsed.content
					});
				})
				.then(() => {
					if (this.options.compileStaticFiles) {

						this.preRenderPages();
						return this.renderPages();
					}
				})
				.then(() => {
					if (this.options.compileStaticFiles) {
						this.postRenderPages();
					}

					this.postRenderTime();
				})
				.catch(function (err) {
					console.log(chalk.red('(!) Error in rendering pages: ', err));
				});
		}).bind(this);
		// Render all pages when partial was changed
		let renderPagesPartials = (function (obj) {
			this.loader.readFile({
					srcPath: obj.file,
					typePath: this.cwd + this.options.types.partials.dir,
					type: 'partials',
					ext: this.options.ext,
					dest: this.options.dest,
					flatten: this.options.flatten,
					createDeepIds: this.options.types.partials.createDeepIds
				})
				.then((data) => {
					this.preRenderTime();
					this.data.replaceInCache({
						type: 'partials',
						id: data.id,
						data: data
					});

					return this.data.cache.partials[data.filename];
				})
				.then((data) => {
					return this.templater.registerPartial({
						filename: data.filename,
						template: data.parsed.content
					});
				})
				.then(() => {
					if (this.options.compileStaticFiles) {
						this.preRenderPages();
						return this.renderPages();
					}
				})
				.then(() => {
					if (this.options.compileStaticFiles) {
						this.postRenderPages();
					}

					this.postRenderTime();
				})
				.catch(function (err) {
					console.log(chalk.red('(!) Error in rendering pages: ', err));
				});
		}).bind(this);

		this.events.registerEvent('pages:changed', renderPage);
		this.events.registerEvent('data:changed', renderPagesData);
		this.events.registerEvent('partials:changed', renderPagesPartials);
		this.events.registerEvent('layouts:changed', renderPagesLyt);
	}

	/**
	 * Get all files of types (pages, data, layouts, partials) by
	 * normalizing paths (buildPaths()) and using
	 * getFiles().
	 */
	getAllFiles() {
		console.time(this.timeLogs.getting);

		const getFilesOfType = (type) => {
			return this.buildPaths({
					dir: this.options.types[type].dir,
					files: this.options.types[type].files
				})
				.then((data) => {
					return this.getFiles(data);
				})
				.then((data) => {
					this[type + 'Files'] = data;

					return data;
				});
		};

		let pagesFiles = getFilesOfType('pages');
		let dataFiles = getFilesOfType('data');
		let partialsFiles = getFilesOfType('partials');
		let layoutsFiles = getFilesOfType('layouts');
		let helpersFiles = this.getFiles(this.cwd + this.options.helpers)
			.then((pages) => {
				this.helpersFiles = pages;
				return pages;
			});

		return Promise
			.all([
				helpersFiles,
				pagesFiles,
				dataFiles,
				partialsFiles,
				layoutsFiles
			])
			.then(() => {
				return console.log(chalk.green('OK: All files are saved!'));
			})
			.catch((err) => {
				console.log(chalk.red('(!) Error in caching all files: ', err));
			})
	}

	/**
	 * Get specific files by using this.loader(). Globbing is supported.
	 *
	 * @see ./modules/loader.js
	 *
	 * @param {String} filepath - Filepath to file
	 *
	 * @return Promise with loaded files
	 */
	getFiles(filepath) {
		return this.loader.getFiles(filepath)
			.then((data) => {
				return data;
			})
			.catch(function (err) {
				console.log('Error in getting files: ', err);
			});
	}


	/**
	 * Cache all files (pages, data, partials, layouts) and return a new promise.
	 *
	 * @return Promise
	 */
	cacheAllFiles() {
		const cacheType = (type) => {
			return this.cacheFiles({
				files: this[type + 'Files'],
				type: type
			}).then((data) => {
				return data;
			});
		};

		let pageCache = cacheType('pages');
		let partialCache = cacheType('partials');
		let layoutCache = cacheType('layouts');
		let dataCache = cacheType('data');

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
		return this.loader.readFile(obj.path)
			.then((data) => {
				let file = Helpers.getFilename(obj.path);
				let typePath = this.cwd + this.options.types[obj.type].dir;
				let createDeepIds = this.options.types[obj.type].createDeepIds;
				let pathDelimiter = this.options.types[obj.type].pathDelimiter;
				let destPath = this.options.dest;
				let assetsPath = this.options.assets;
				let flatten = this.options.flatten;
				let ext = this.options.ext;

				return {
					id: createDeepIds === true ? Helpers.cleanId({
						srcPath: obj.path,
						typePath: typePath,
						pathDelimiter: pathDelimiter,
						file: file
					}) : file,
					assets: Helpers.assetsPath(destPath + Helpers.buildPath({
							srcPath: obj.path,
							typePath: typePath
						}), destPath + assetsPath),
					ext: ext,
					basename: path.basename(obj.path),
					filename: file,
					dirname: path.dirname(obj.path),
					destDir: destPath,
					destSubDir: Helpers.buildPath({
						srcPath: obj.path,
						typePath: typePath
					}),
					destFile: flatten ? file + ext : Helpers.buildId({
						srcPath: obj.path,
						typePath: typePath,
						file: file
					}) + ext,
					raw: data.data,
					parsed: data.parsedData
				};
			})
			.then((data) => {
				this.data.addToCache({
					type: obj.type,
					id: data.id,
					data: obj.type !== 'data' ? data : data.parsed
				});

				return this.data.cache[obj.type];
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
			repository: this.data.cache.repository.pages,
			pages: this.data.cache.pages,
			cache: this.data.cache
		});
	}

	/**
	 * Render one single page.
	 *
	 * @param {Object} fileData - Data object of file
	 */
	renderPage(fileData) {
		return this.templater.renderOne({
			page: fileData,
			cache: this.data.cache
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
		chalk.bold(console.timeEnd(this.timeLogs.finish));
		console.log('\n');
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
		console.info(chalk.cyan('======== Started Mangony Watcher ========'));

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