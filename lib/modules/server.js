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
const BrowserSync = require('browser-sync');
const bsc = require('connect-browser-sync');
const Helpers = require('../utils/helpers');
const events = require('../utils/events');

class Server {
	constructor(opts) {
		this.options = {
			bsEnabled: true, // Enable BrowserSync
			bs: false, // Browser-Sync instance, when not passed, a new express instance is created
			bsOptions: false, // Browser-Sync options object
			data: false, // Mangony instance
			dest: false,
			express: false, // Express instance, when not passed, a new express instance is created
			ext: false,
			injectScript: true, // Inject browser-sync script
			port: 3000, // Port for server
			templater: false, // Mangony instance
			useExt: false
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
		let bsOptions = this.options.bsOptions;
		bsOptions.logSnippet = false;
		bsOptions.logPrefix = 'Mangony-Server';
		
		this.app = this.options.express || Express();
		this.bs = this.options.bsEnabled ? this.options.bs || BrowserSync(bsOptions) : null;

		this.bindEvents();
	}

	bindEvents() {
		let fnReloadServer = this.reloadServer.bind(this);
		let fnRegisterRoute = this.registerRoute.bind(this);

		events.registerEvent(this.options.evtNamespace + events.EVENTS.cache.updated, fnReloadServer);
		events.registerEvent(this.options.evtNamespace + events.EVENTS.route.register, fnRegisterRoute);
	}

	startServer(obj) {
		console.log(chalk.bold(chalk.cyan('\n*** Starting Mangony-Express ... ***\n')));

		if (this.options.injectScript && this.options.bsEnabled) this.app.use(bsc(this.bs));
		
		this.app.set('port', this.options.port);
		this.app.use(Express.static(this.options.dest));

		this.app.listen(this.app.get('port'), () => {
			console.log(chalk.yellow('\nExpress server started on port ' + this.app.get('port') + ' serving static files from ' + this.options.dest + ' folder.\n'));
		});

		this.registerRoutes(obj);
	}

	reloadServer() {
		this.bs.reload();
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
				route: pageFile.serverFile
			});
		});
	}

	registerRoute(obj) {
		if (!obj || !obj.route || !obj.id) {
			console.error(chalk.red('(!) obj.route or obj.id is not defined!'));
			return;
		}
		let ext = this.options.useExt ? this.options.data.cache.pages[obj.id].ext : '';

		console.info(chalk.green('Route ' + chalk.cyan(obj.route + ext) + ' is registered!'));

		this.app.get('/' + obj.route + ext, (req, res) => {
			let pageFile = this.options.data.cache.pages[obj.id];

			res.send(this.options.templater.renderOne({
				page: pageFile,
				cache: this.options.data.cache
			}));
		});
	}
}

module.exports = Server;