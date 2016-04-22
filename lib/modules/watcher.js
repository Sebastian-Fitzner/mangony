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
			dir: false
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
		//if (!this.options.type || !this.options.dir) {
		//	console.warn(chalk.red('ERROR: You need to define a type and directory!'));
		//	return;
		//}

		this.watchDir = null;
		this.watch();

	}

	watch() {
		this.watchDir = chokidar.watch(this.options.dir, {
			persistent: true
		});

		this.bindEvents();
	}

	bindEvents() {
		this.watchDir.on('add', (filepath) => {
			Events.emitEvent(this.options.type + ':add', {
				file: path.normalize(filepath)
			});
			console.log(chalk.green(chalk.bold((this.options.type + ' watcher: ').toUpperCase()) + 'File', chalk.cyan(filepath), 'has been added!'));
		});

		this.watchDir.on('unlink', (filepath) => {
			Events.emitEvent(this.options.type + ':delete', {
				file: path.normalize(filepath)
			});
			console.log(chalk.magenta(chalk.bold((this.options.type + ' watcher: ').toUpperCase()) + 'File', chalk.cyan(filepath), 'has been deleted from!'));
		});

		this.watchDir.on('change', (filepath) => {
			Events.emitEvent(this.options.type + ':changed', {
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