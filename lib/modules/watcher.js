/**
 * Represents a watcher which
 * watches a directory and
 * emit specific events.
 *
 * @module watcher
 *
 * @author Sebastian Fitzner
 */

'use strict';

const chokidar = require('chokidar');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const Helpers = require('../utils/helpers');
const Events = require('../utils/events');

class Watcher {
	constructor(opts) {
		this.options = {
			type: false,
			files: false
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
		if (!this.options.type || !this.options.files) {
			console.error(chalk.red('Mangony Watcher ERROR: You need to define a type and files!'));
			return;
		}

		this.watchDir = null;
		this.watch();

	}

	watch() {
		const files = this.options.files.filter(file => !file.startsWith('!'));
		let watchers = [];
		// Check for folder existence
		for (let i = 0; i < files.length; i++) {
			watchers.push(this.checkDirectory(files[i]));
		}

		Promise.all(watchers)
			.then(() => {
				console.log(chalk.green(`Mangony Watcher :: Added watcher for ${this.options.type}`));
			})
			.catch();

		// Start watching ...
		this.watchDir = chokidar.watch(this.options.files, {
			persistent: true
		});

		this.watchDir.add(this.options.files);
		this.ready();
	}

	ready() {
		this.watchDir.on('ready', () => {
			console.log(chalk.green('Initial file scan for ' + chalk.cyan(this.options.type) + ' is done!'));

			this.bindEvents();
			if (this.options.exportData) {
				Helpers.write(this.options.cwd + 'exported/watcher-' + this.options.type + '.json', JSON.stringify(this.watchDir.getWatched(), null, 4));
			}
		});
	}

	bindEvents() {
		this.watchDir.on('add', (filepath) => {
			Events.emitEvent(this.options.type + ':add', {
				evt: 'add',
				file: path.normalize(filepath)
			});
			console.log(chalk.green(chalk.bold((this.options.type + ' watcher: ').toUpperCase()) + 'File', chalk.cyan(filepath), 'has been added!'));
		});

		this.watchDir.on('unlink', (filepath) => {
			Events.emitEvent(this.options.type + ':delete', {
				evt: 'delete',
				file: path.normalize(filepath),
				type: this.options.type
			});
			console.log(chalk.magenta(chalk.bold((this.options.type + ' watcher: ').toUpperCase()) + 'File', chalk.cyan(filepath), 'has been deleted!'));
		});

		this.watchDir.on('change', (filepath) => {
			Events.emitEvent(this.options.type + ':changed', {
				evt: 'change',
				file: path.normalize(filepath)
			});
			console.log(chalk.yellow(chalk.bold((this.options.type + ' watcher: ').toUpperCase()) + 'File', chalk.cyan(filepath), 'has been changed!'));
		});
	}

	close() {
		this.watchDir.close();
	}

	checkDirectory(dir) {
		const baseDir = path.dirname(dir);
		const pathItems =  baseDir.split('/');
		const globIndex = pathItems.findIndex((pathItem) => pathItem === '**' || pathItem === '*');
		const basePath = pathItems.slice(0, globIndex).join('/');

		return Helpers
			.fileExists(`${path.join(process.cwd(), basePath)}`)
			.then((data) => {
				if (!data) {
					return Helpers.fileExists(basePath);
				} else {
					return true;
				}
			})
			.then(data => {
				if (!data) {
					throw new Error(chalk.red(`
Mangony Watcher ERROR :: Path ${chalk.bold(basePath)} does not exists in your project.
But you defined ${chalk.bold(dir)} in your Mangony options in type ${this.options.type}!
Please update the options object or create the folder. Otherwise the watcher cannot be started ...\n`));
				} else {
					return true;
				}
			});
	}

}

module.exports = Watcher;
