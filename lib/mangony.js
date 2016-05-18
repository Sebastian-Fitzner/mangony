/**
 * Represents a Mangony class which is used to generate HTML pages
 * with layouts, data files (JSON, HJSON, Markdown), partials and pages
 * by using Handlebars.
 *
 * TODO: Plugin ecosystem
 * TODO: Clean up of bindEvents
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
const Server = require('./modules/server');
const Watcher = require('./modules/watcher');

global.Mangony = {
	platform: process.platform,
	debug: false
};

class Mangony {
	constructor(opts) {
		this.options = {
			assets: '', // Assets directory
			collections: [],
			compileStaticFiles: true,
			cwd: 'src', // Set the current directory
			debug: false,
			dest: 'app', // Set the destination path
			devServer: {
				start: false,
				port: 3000,
				express: null
			},
			exportData: false, // Export the complete data stack as JSON file
			ext: '.html', // Extension of destination files
			flatten: false, // Flatten the destination directory
			helpers: false, // Custom helpers files - globbing supported (example: 'helpers/*.js')
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
		this.data = new Data({
			collections: this.options.collections
		});
		this.dest = Helpers.endsWithSlash(this.options.dest) ? this.options.dest : this.options.dest + '/';
		this.events = events;
		this.loader = loader;
		this.templater = new Templater({
			compileStaticFiles: this.options.compileStaticFiles
		});
		this.server = this.options.devServer.start ? new Server({
			dest: this.dest,
			templater: this.templater,
			data: this.data,
			express: this.options.devServer.express,
			port: this.options.devServer.port
		}) : null;
		this.timeLogs = {
			getting: 'Got all files in',
			caching: 'Cached all files in',
			compiling: 'Compiled all files in',
			registering: 'Registered files in',
			finish: '\nMangony completed in'
		};
		this.watchers = this.options.watch ? {} : null;

		this.dataFiles = null;
		this.layoutsFiles = null;
		this.pagesFiles = null;
		this.partialsFiles = null;


		if (this.options.watch) this.bindEvents();
		if (this.options.debug) global.Mangony.debug = true;

		this.preRenderTime();
	}

	/**
	 * Compile/Render the complete stack by
	 * - getting all files (getAllFiles())
	 * - caching all files (cacheAllFiles())
	 * - registering helpers (templater)
	 * - registering partials (templater)
	 * - registering layouts (templater)
	 * - render all pages (renderAllPages()) or
	 * - register all routes (server).
	 */
	render() {
		if (this.options.watch) this.createWatchers();

		return this.prepareData()
			.then(() => {
				if (this.options.devServer.start) this.data.cache.servermode = true;
				return this.prepareTemplates()
			})
			.then(() => {
				this.writeDataFile();

				if (this.options.devServer.start) {
					this.server.startServer({
						repository: this.data.cache.__repository.pages,
						pages: this.data.cache.pages
					});
				} else {
					this.preRenderPages();

					return this.renderPages();
				}

			})
			.then(() => {
				if (!this.options.devServer.start) this.postRenderPages();
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

				return data;
			})
			.catch((err) => {
				console.warn(chalk.red('\n(!) Error in preparing files: \n' + err));
			});
	}

	prepareTemplates() {
		console.time(this.timeLogs.registering);

		return this.templater.registerHelpers(this.helpersFiles)
			.then(() => {
				return this.templater.registerPartials({
					repository: this.data.cache.__repository.partials,
					partials: this.data.cache.__partials
				});
			})
			.then(() => {
				return this.templater.registerPartials({
					repository: this.data.cache.__repository.layouts,
					partials: this.data.cache.__layouts
				});
			})
			.then((data) => {
				console.timeEnd(this.timeLogs.registering);

				return data;
			})
			.catch((err) => {
				console.warn(chalk.red('\n(!) Error in registering helpers and templates: \n' + err));
			});
	}

	/**
	 * Bind all events for the watcher.
	 * This will only be used if this.options.watch === true.
	 */
	bindEvents() {
		// render single page
		let renderPage = (function (obj) {
			this.loader.readFile(obj.file)
				.then((data) => {
					return this.createData({
						path: obj.file,
						type: 'pages',
						data: data
					});
				})
				.then((data) => {
					this.preRenderTime();

					this.data.replaceInCache({
						type: 'pages',
						id: data.id,
						data: data
					});

					return this.data.cache.pages[data.id];
				})
				.then((fileData) => {
					this.writeDataFile();

					if (this.options.compileStaticFiles) {
						this.preRenderPages();
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
					console.log(chalk.red('\n(!) Error in rendering page: \n', err));
				});
		}).bind(this);
		// Render pages when data was changed
		let renderPagesData = (function (obj) {
			this.loader.readFile(obj.file)
				.then((data) => {
					return this.createData({
						path: obj.file,
						type: 'data',
						data: data
					});
				})
				.then((data) => {
					let dataObj = {
						type: 'data',
						id: data.id,
						data: data
					};

					this.preRenderTime();

					if (obj.evt === 'add') {
						this.data.addToCache(dataObj);
					} else {
						this.data.replaceInCache(dataObj);
					}

					return this.data.cache;
				})
				.then(() => {
					this.writeDataFile();

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
					console.log(chalk.red('\n(!) Error in rendering pages: \n', err));
				});
		}).bind(this);
		// Render all pages when layout was changed
		let renderPagesLyt = (function (obj) {
			this.loader.readFile(obj.file)
				.then((data) => {
					return this.createData({
						path: obj.file,
						type: 'layouts',
						data: data
					});
				})
				.then((data) => {
					let dataObj = {
						type: 'layouts',
						id: data.id,
						data: data
					};

					this.preRenderTime();

					if (obj.evt === 'add') {
						this.data.addToCache(dataObj);
					} else {
						this.data.replaceInCache(dataObj);
					}

					return this.data.cache.__layouts[data.id];
				})
				.then((data) => {
					this.writeDataFile();

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
					console.log(chalk.red('\n(!) Error in rendering pages: \n', err));
				});
		}).bind(this);
		// Render all pages when partial was changed
		let renderPagesPartials = (function (obj) {
			this.loader.readFile(obj.file)
				.then((data) => {
					return this.createData({
						path: obj.file,
						type: 'partials',
						data: data
					});
				})
				.then((data) => {
					let dataObj = {
						type: 'partials',
						id: data.id,
						data: data
					};

					this.preRenderTime();

					if (obj.evt === 'add') {
						this.data.addToCache(dataObj);
					} else {
						this.data.replaceInCache(dataObj);
					}

					return this.data.cache.__partials[data.id];
				})
				.then((data) => {
					this.writeDataFile();

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
					console.log(chalk.red('\n(!) Error in rendering pages: \n', err));
				});
		}).bind(this);

		let deleteFromCache = ((obj) => {
			let id = this.createFileId({
				path: obj.file,
				type: obj.type
			});

			this.data.deleteFromCache({
				type: obj.type,
				id: id
			});

			console.log(chalk.green('File ' + chalk.cyan(id) + ' deleted from cache!\n'));

		}).bind(this);

		this.events.registerEvent('pages:changed', renderPage);
		this.events.registerEvent('pages:add', renderPage);
		this.events.registerEvent('pages:delete', deleteFromCache);
		this.events.registerEvent('data:changed', renderPagesData);
		this.events.registerEvent('data:add', renderPagesData);
		this.events.registerEvent('data:delete', deleteFromCache);
		this.events.registerEvent('partials:changed', renderPagesPartials);
		this.events.registerEvent('partials:add', renderPagesPartials);
		this.events.registerEvent('partials:delete', deleteFromCache);
		this.events.registerEvent('layouts:changed', renderPagesLyt);
		this.events.registerEvent('layouts:add', renderPagesLyt);
		this.events.registerEvent('layouts:delete', deleteFromCache);
	}

	writeDataFile() {
		if (this.options.exportData) {
			Helpers
				.write(this.cwd + 'exported/exported-data.json', JSON.stringify(this.data.cache, null, 4))
				.catch((err) => {
					console.warn(chalk.red('\n(!) The file could not be written: \n', err));
				});
		}
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
				console.log(chalk.red('\n(!) Error in caching all files: \n', err));
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
				console.log('\nError in getting files: \n', err);
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
				return this.createData({
					path: obj.path,
					type: obj.type,
					data: data
				});
			})
			.then((data) => {
				this.data.addToCache({
					type: obj.type,
					id: data.id,
					data: obj.type !== 'data' ? data : data.parsed
				});

				return this.data.cache;
			})
			.catch(function (err) {
				console.log('\nError in caching files: \n', err);
			});
	}

	createFileId(obj) {
		let file = Helpers.getFilename(obj.path);

		return this.options.types[obj.type].createDeepIds ? Helpers.cleanId({
			srcPath: obj.path,
			typePath: this.cwd + this.options.types[obj.type].dir,
			pathDelimiter: this.options.types[obj.type].pathDelimiter,
			file: file
		}) : file;

	}

	createData(obj) {
		let file = Helpers.getFilename(obj.path);
		let typePath = this.cwd + this.options.types[obj.type].dir;
		let destPath = this.dest;
		let assetsPath = this.options.assets;
		let flatten = this.options.flatten;
		let ext = this.options.ext;
		let id = Helpers.buildId({
			srcPath: obj.path,
			typePath: typePath,
			file: Helpers.getFilename(obj.path)
		});

		return {
			id: this.createFileId({
				path: obj.path,
				type: obj.type
			}),
			assets: Helpers.assetsPath(destPath + Helpers.buildPath({
					srcPath: obj.path,
					typePath: typePath
				}), destPath + assetsPath),
			ext: ext,
			srcExt: path.extname(obj.path),
			basename: path.basename(obj.path),
			filename: file,
			dirname: path.dirname(obj.path),
			destDir: destPath,
			destSubDir: Helpers.buildPath({
				srcPath: obj.path,
				typePath: typePath
			}),
			destFile: flatten ? file + ext : id + ext,
			serverFile: flatten ? file : id,
			raw: obj.data.data,
			parsed: obj.data.parsedData
		};
	}

	/**
	 * Render all pages by using cache
	 */
	renderPages() {
		return this.templater.renderAll({
			repository: this.data.cache.__repository.pages,
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
			return path.normalize(this.cwd + obj.dir + '/' + file);
		});
	}

	/**
	 * Create all watcher instances
	 */
	createWatchers() {
		console.info(chalk.cyan(chalk.bold('*** Started Mangony Watcher ***\n')));

		this.watchers.partials = this.addWatcher('partials');
		this.watchers.layouts = this.addWatcher('layouts');
		this.watchers.pages = this.addWatcher('pages');
		this.watchers.data = this.addWatcher('data');

	}

	/**
	 * Add a custom watcher to a directory.
	 *
	 * @param {String} type - The defined type
	 */
	addWatcher(type) {
		return this.buildPaths({
			dir: this.options.types[type].dir,
			files: this.options.types[type].files
		})
			.then((files) => {
				new Watcher({
					cwd: this.cwd,
					exportData: this.options.exportData,
					type: type,
					files: files
				});
			});
	}
}

module.exports = Mangony;