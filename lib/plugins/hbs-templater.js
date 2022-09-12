import Promise from 'bluebird';
import deepMerge from 'deepmerge';
import handlebars from 'handlebars';
import layouts from 'handlebars-layouts';
import markdownIt from 'markdown-it';
import mda from 'markdown-it-attrs';
import chalk from 'chalk';
import mgyHelpers from 'mangony-hbs-helpers';
import mgyHelperWrapWith from 'mangony-hbs-helper-wrap-with';
import Templater from '../modules/templater.js';
import loader from '../utils/loader.js';
import events from '../utils/events.js';
import handlebarsHelpers from 'handlebars-helpers';

/**
 * Represents a Templater plugin.
 * @module Templater
 *
 * @author Sebastian Fitzner
 */
'use strict';
const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

class HbsTemplater extends Templater {
  constructor(opts, context) {
    let options = {
      helpers: [
        'test/fixtures/helpers/*.js',
      ],
      compileStaticFiles: true,
    };
    super(deepMerge(options, opts));
    this.context = context;
  }

  // GETTER AND SETTER
  get engine() {
    return this._engine;
  }

  set engine(engine) {
    this._engine = engine;
  }

  initialize() {
    this.engine = handlebars.create();
    this.helperFiles = null;
    this.layoutsFiles = null;
    this.partialsFiles = null;
    md.use(mda);
    handlebarsHelpers({ handlebars: this.engine });
    layouts.register(this.engine);
    mgyHelpers.register(this.engine);
    mgyHelperWrapWith.register(this.engine);
    return loader.getFiles(this.options.helpers).then(files => {
      this.helperFiles = files;
      this.bindEvents();
      return this.prepareTemplates();
    });
  }

  bindEvents() {
    // Render all pages when layout was changed
    let renderPagesLyt = obj => {
      loader.readFile(obj.file)
        .then((data) => {
          return this.context.createData({
            path: obj.file,
            type: 'layouts',
            data: data,
          });
        })
        .then((data) => {
          let dataObj = {
            type: 'layouts',
            id: data.id,
            data: data,
          };
          this.context.preRenderTime('render_layout');
          if (obj.evt === 'add') {
            this.context.data.addToCache(dataObj);
          } else {
            this.context.data.replaceInCache(dataObj);
          }
          return this.context.data.cache.__layouts[data.id];
        })
        .then((data) => {
          this.context.writeDataFile();
          return this.registerPartial({
            id: data.id,
            template: data.parsed.content,
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
          this.context.postRenderTime('render_layout');
          this.context.triggerReload();
        })
        .catch(function(err) {
          console.log(chalk.red('\n(!) Error in rendering pages: \n', err));
        });
    };
    // Render all pages when partial was changed
    let renderPagesPartials = obj => {
      loader.readFile(obj.file)
        .then((data) => {
          return this.context.createData({
            path: obj.file,
            type: 'partials',
            data: data,
          });
        })
        .then((data) => {
          let dataObj = {
            type: 'partials',
            id: data.id,
            data: data,
          };
          this.context.preRenderTime('render_partial');
          if (obj.evt === 'add') {
            this.context.data.addToCache(dataObj);
          } else {
            this.context.data.replaceInCache(dataObj);
          }
          return this.context.data.cache.__partials[data.id];
        })
        .then((data) => {
          this.context.writeDataFile();
          return this.registerPartial({
            id: data.id,
            template: data.parsed.content,
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
          this.context.postRenderTime('render_partial');
          this.context.triggerReload();
        })
        .catch(function(err) {
          console.log(chalk.red('\n(!) Error in rendering pages: \n', err));
        });
    };
    events.registerEvent(this.context.evtNamespace + this.context.events.cache.updated, ({ page }) => {
      this.renderOne({
        page,
        cache: this.context.data.cache,
      });
    });
    events.registerEvent(this.context.evtNamespace + this.context.events.partials.add, renderPagesPartials);
    events.registerEvent(this.context.evtNamespace + this.context.events.partials.changed, renderPagesPartials);
    events.registerEvent(this.context.evtNamespace + this.context.events.layouts.add, renderPagesLyt);
    events.registerEvent(this.context.evtNamespace + this.context.events.layouts.changed, renderPagesLyt);
  }

  /**
   * Render single page.
   *
   * @param {Object} obj - Object
   * @param {Object} obj.page - Page object
   * @param {Object} obj.pageContent - Page Content Template
   * @param {Object} obj.data - Cache object
   *
   * @public
   */
  renderTemplate({ pageContent, page, data }) {
    let pageSrcExt = page.srcExt || '';
    let template = this.engine.compile(pageContent);
    const content = pageSrcExt === '.md' ? md.render(template(data)) : template(data);
    return Promise.resolve(content);
  }

  /**
   * Register multiple partials.
   *
   * @param {Object} obj - Object
   * @param {Array} obj.repository - Object
   * @param {Object} obj.partials - Object
   *
   * @return Promise (all partials)
   */
  registerPartials(obj) {
    return Promise.map(obj.repository, (name) => {
      let partialFile = obj.partials[name];
      return this.registerPartial({
        id: partialFile.id,
        template: partialFile.parsed.content,
      });
    });
  }

  /**
   * Register one single partial.
   *
   * @param {Object} obj - Object
   * @param {Object} obj.id - The partial file id
   * @param {Object} obj.template - The partial content of the file
   *
   * @return Promise with registered partial
   */
  registerPartial(obj) {
    return new Promise((resolve) => {
      let registerPartial = this.engine.registerPartial(obj.id, obj.template);
      resolve(registerPartial);
    });
  }

  /**
   * Register all helpers.
   *
   * @param {Array} helpers - Array of helpers
   *
   * @return Promise
   */
  registerHelpers(helpers) {
    return Promise.map(helpers, (helper) => {
      return this.registerHelper({
        file: helper,
      });
    });
  }

  /**
   * Register one single helper.
   *
   * @param {Object} obj - Object
   * @param {Object} obj.file - Helper file
   *
   * @return Promise
   */
  registerHelper(obj) {
    return new Promise((resolve) => {
      let registerHelper;
      if (helper.register) {
        registerHelper = this.engine.registerHelper(helper.register(this.engine, this.options));
      }
      resolve(registerHelper);
    });
  }

  prepareTemplates() {
    console.time(this.context.timeLogs.registering);
    return this.registerHelpers(this.helperFiles)
      .then(() => {
        return this.registerPartials({
          repository: this.context.data.cache.__repository.partials,
          partials: this.context.data.cache.__partials,
        });
      })
      .then(() => {
        return this.registerPartials({
          repository: this.context.data.cache.__repository.layouts,
          partials: this.context.data.cache.__layouts,
        });
      })
      .then((data) => {
        console.timeEnd(this.context.timeLogs.registering);
        return data;
      })
      .catch((err) => {
        console.warn(chalk.red('\nMangony :: Error in registering helpers and templates: \n' + err));
      });
  }

  /**
   * Time starting of compiling
   */
  preRenderPages() {
    console.time(`Compiling all files in: `);
    console.log(chalk.cyan(chalk.bold('\n*** Compiling started ... ***\n')));
  }

  /**
   * Time ending of compiling
   */
  postRenderPages() {
    console.log(chalk.cyan(chalk.bold('\n*** Compiling successful! ***\n')));
    console.time(`Compiling all files in: `);
  }

  /**
   * Render all pages by using cache
   */
  renderPages() {
    return this.renderAll({
      repository: this.context.data.cache.__repository.pages,
      pages: this.context.data.cache.pages,
      cache: this.context.data.cache,
    });
  }
}

const HbsTemplaterPlugin = {
  pluginName: 'Templater',
  initialize: function(mangonyInstance, opts) {
    const hbsTemplater = new HbsTemplater(opts, mangonyInstance);
    mangonyInstance.templater = hbsTemplater;
    return hbsTemplater.initialize();
  },
};
export default HbsTemplaterPlugin;
