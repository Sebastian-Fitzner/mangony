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
const Helpers = require('../utils/helpers');
const Events = require('../utils/events');
const path = require('path');

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
			console.error(chalk.red('ERROR: You need to define a type and files!'));
			return;
		}

		this.watchDir = null;
		this.watch();

	}

	watch() {
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
}

module.exports = Watcher;