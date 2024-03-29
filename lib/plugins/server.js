import Promise from 'bluebird';
import Express from 'express';
import chalk from 'chalk';
import BrowserSync from 'browser-sync';
import bsc from 'connect-browser-sync';
import Helpers from '../utils/helpers.js';
import events from '../utils/events.js';

/**
 * Represents a Mangony adapter for express to use Mangony's cache, file handling and rendering in express.
 *
 * @module Mangony Express
 *
 * @author Sebastian Fitzner
 */
'use strict';

class Server {
  constructor(opts) {
    this.options = {
      bsEnabled: true,
      bs: null,
      bsOptions: {
        notify: false,
        open: false,
        port: 2999,
      },
      express: null,
      injectScript: true,
      port: 3000,
      start: false,
      useExt: true,
      usePort: true,
      useAssetsDir: true,
      templater: false,
      data: false,
      dest: false,
      ext: false,
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

  /**
   * Start server instance.
   * @param {Object} obj - Object containing cache data
   */
  startServer(obj) {
    console.log(chalk.bold(chalk.cyan('\n*** Starting Mangony-Server ... ***\n')));
    if (this.options.injectScript && this.options.bsEnabled) {
      console.log(chalk.cyan('Mangony-Server :: Browser-Sync enabled.'));
      this.app.use(bsc(this.bs));
    }
    if (this.options.useAssetsDir)
      this.app.use(Express.static(this.options.dest));
    if (this.options.usePort) {
      this.app.set('port', this.options.port);
      this.app.listen(this.app.get('port'), () => {
        console.log(chalk.yellow('\nMangony-Server :: Express server started on port ' + this.app.get('port') + ' serving static files from ' + this.options.dest + ' folder.\n'));
      });
    }
    this.registerRoutes(obj);
  }

  reloadServer() {
    if (this.options.bsEnabled)
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
        route: pageFile.serverFile,
      });
    });
  }

  registerRoute(obj) {
    if (!obj || !obj.route || !obj.id) {
      console.error(chalk.red('(!) obj.route or obj.id is not defined!'));
      return;
    }
    let ext = this.options.useExt ? this.options.data.cache.pages[obj.id].ext : '';
    console.info(chalk.green('Mangony-Server :: Route ' + chalk.cyan(obj.route + ext) + ' is registered!'));
    this.app.get('/' + obj.route + ext, (req, res) => {
      let pageFile = this.options.data.cache.pages[obj.id];
      this.options.templater.renderOne({
        page: pageFile,
        cache: this.options.data.cache,
      })
        .then(content => res.send(content))
        .catch(err => {
          return res.send(err.toString());
        });
    });
  }
}

const ServerPlugin = {
  pluginName: 'server',
  initialize: function(Mangony, opts) {
    Mangony.server = new Server({
      evtNamespace: Mangony.evtNamespace,
      bs: opts.bs,
      bsEnabled: opts.bsEnabled,
      bsOptions: opts.bsOptions,
      data: Mangony.data,
      dest: Mangony.dest,
      injectScript: opts.injectScript,
      express: opts.express,
      ext: Mangony.options.ext,
      port: opts.port,
      templater: Mangony.templater,
      useExt: opts.useExt,
      usePort: opts.usePort,
      useAssetsDir: opts.useAssetsDir,
    });
    Mangony.data.cache.servermode = true;
    Mangony.server.startServer({
      repository: Mangony.data.cache.__repository.pages,
      pages: Mangony.data.cache.pages,
    });
    return Mangony;
  },
};
export default ServerPlugin;
