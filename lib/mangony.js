'use strict';
const Promise = require('bluebird');
const Helpers = require('./utils/helpers');
const events = require('./utils/events');
const Templater = require('./plugins/templater');
const DataHandler = require('./modules/data-handler');
const loader = require('./modules/loader');
const Watcher = require('./modules/watcher');
const handlebars = require('handlebars');
const chalk = require('chalk');
const path = require('path');

class Mangony {
	constructor(opts) {
		this.options = {
			exportData: true,
			cwd: false,
			dest: 'test/expected',
			types: {
				data: {
					dir: '',
					files: []
				},
				partials: {
					dir: '',
					files: []
				},
				layouts: {
					dir: '',
					files: []
				},
				pages: {
					dir: '',
					files: []
				},
				custom: [
					{
						type: 'docs',
						dir: '',
						files: []
					}
				]
			},
			helpers: false,
			assets: '',
			flatten: false,
			ext: '.html',
			watch: false
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
		this.watchers = this.options.watch ? {} : null;
		this.cwd = this.options.cwd.substr(this.options.cwd.length - 1) === '/' ? this.options.cwd : typeof this.options.cwd === 'string' ? this.options.cwd + '/' : '';
		this.timeLogs = {
			getting: 'Got all files in',
			caching: 'Cached all files in',
			compiling: 'Compiled all files in',
			registering: 'Registered files in',
			finish: '\nMangony completed rendering in'
		};
		this.pageFiles = null;
		this.partialFiles = null;
		this.dataFiles = null;
		this.layoutFiles = null;

		if (this.options.watch) this.bindEvents();

		this.preRenderTime();
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

	bindEvents() {
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
	}

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
	;

	cacheFiles(obj) {
		return Promise.map(obj.files, (file) => {
			return this.cacheFile({
				path: file,
				type: obj.type
			});
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
				console.log(chalk.green('OK: All files are cached!'));
				return data;
			});
	}


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

	preRenderPages() {
		console.time(this.timeLogs.compiling);
		console.log(chalk.cyan(chalk.bold('\n*** Compiling started ... ***\n')));
	}

	renderPages() {
		if (this.options.exportData) {
			Helpers.write(this.cwd + 'exported/exported-data.json', JSON.stringify(this.dataHandler.cache, null, 2))
				.catch((err) => {
					console.warn(chalk.red('(!) The file could not be written: ', err));
				});
		}

		return this.templater.renderAll({
			repository: this.dataHandler.cache.repository.pages,
			pages: this.dataHandler.cache.pages,
			data: this.dataHandler.cache.data,
			ext: this.options.ext,
			dest: this.options.dest
		});
	}

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

	postRenderPages() {
		console.log(chalk.cyan(chalk.bold('\n*** Compiling successful! ***\n')));
		console.timeEnd(this.timeLogs.compiling);
	}

	preRenderTime() {
		console.time(this.timeLogs.finish);
	}

	postRenderTime() {
		console.timeEnd(this.timeLogs.finish);
	}
}

module.exports = Mangony;