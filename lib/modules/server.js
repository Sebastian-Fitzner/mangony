/**
 * Represents a Mangony adapter for express to use mangonys cache, file handling and rendering in express.
 *
 * @module Mangony Express
 *
 * @author Sebastian Fitzner
 */

'use strict';

const Promise = require('bluebird');
const Express = require('express');
const chalk = require('chalk');
const Helpers = require('../utils/helpers');

class Server {
	constructor(opts) {
		this.options = {
			dest: false,
			templater: false, // Mangony instance
			data: false, // Mangony instance
			express: false, // Express instance, when not passed, a new express instance is created
			port: 3000 // Port for server
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
		this.app = this.options.express || Express();
		this.ext = this.options.ext || '';
	}

	startServer(obj) {
		console.log(chalk.bold(chalk.cyan('*** Starting Magony-Express ... ***')));

		this.app.set('port', process.env.PORT || this.options.port);

		//if(this.options.livereload) {
		//	this.app.use(Livereload({
		//		port: 3000
		//	}));
		//}

		this.app.use(Express.static(this.options.dest));

		this.app.listen(this.app.get('port'), () => {
			console.log(chalk.yellow('\nExpress server started on port ' + this.app.get('port') + ' serving static files from ' + this.options.dest + ' folder.\n'));
		});

		this.registerRoutes(obj);
	}

	registerRoutes(obj) {
		if (!Array.isArray(obj.repository)) {
			console.error(chalk.red(obj.repository + ' in registerRoutes() is not an array or array like object.\n'));
			return;
		}
		return Promise.map(obj.repository, (name) => {
			let pageFile = obj.pages[name];

			return this.registerRoute({
				id: pageFile.id,
				route: pageFile.destFile
			});
		});
	}

	registerRoute(obj) {
		if (!obj || !obj.route || !obj.id) {
			console.error(chalk.red('(!) obj.route or obj.id is not defined!'));
			return;
		}
		console.info(chalk.green('Route ' + chalk.cyan(obj.id) + ' is registered!'));

		this.app.get('/' + obj.id, (req, res) => {
			let pageFile = this.options.data.cache.pages[obj.id];

			res.send(this.options.templater.renderOne({
				page: pageFile,
				cache: this.options.data.cache
			}));
		});
	}
}

module.exports = Server;