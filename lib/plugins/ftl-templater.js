import deepMerge from 'deepmerge';
import Promise from 'bluebird';
import chalk from 'chalk';
import Freemarker from 'freemarker.js';
import path from 'path';
import Templater from '../modules/templater.js';
import events from '../utils/events.js';
import loader from '../utils/loader.js';

class FreemarkerTemplater extends Templater {
  constructor(opts, context) {
    let options = {
      compileStaticFiles: false,
      viewRoot: '',
    };
    super(deepMerge(options, opts || {}));
    this.cwd = '';
    this.context = context;
  }

  initialize(cwd) {
    this.cwd = cwd;
    this.fm = new Freemarker({
      viewRoot: path.join(process.cwd(), `${this.cwd}`),
    });
    this.bindEvents();
  }

  bindEvents() {
    const renderPages = obj => {
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
          this.context.preRenderTime('render_page');
          if (obj.evt === 'add') {
            this.context.data.addToCache(dataObj);
          } else {
            this.context.data.replaceInCache(dataObj);
          }
          return this.context.data.cache.__partials[data.id];
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
          this.context.postRenderTime('render_page');
          this.context.triggerReload();
        })
        .catch(function(err) {
          console.log(chalk.red('\n(!) Mangony :: FTL Templater - Error in rendering pages: \n', err));
        });
    };
    events.registerEvent(this.context.evtNamespace + this.context.events.cache.updated, ({ page }) => {
      this.renderOne({
        page,
        cache: this.context.data.cache,
      });
    });
    events.registerEvent(this.context.evtNamespace + this.context.events.partials.add, renderPages);
    events.registerEvent(this.context.evtNamespace + this.context.events.partials.changed, renderPages);
    events.registerEvent(this.context.evtNamespace + this.context.events.layouts.add, renderPages);
    events.registerEvent(this.context.evtNamespace + this.context.events.layouts.changed, renderPages);
  }

  /**
   * Render single page.
   *
   * @param {Object} obj - Object
   * @param {Object} obj.page - Page object
   * @param {String} [obj.pageContent] - Page Content Template
   * @param {Object} obj.data - Cache object
   *
   * @public
   */
  renderTemplate({ page, data }) {
    const tplPath = path.join(path.relative(this.cwd, page.dirname), page.basename);
    const content = this.fm.renderSync(tplPath, data);
    Promise.resolve(content);
  }
}

const FreemarkerTemplaterPlugin = {
  pluginName: 'Templater',
  initialize: function(mangonyInstance, opts) {
    const freemarkerTemplater = new FreemarkerTemplater(opts, mangonyInstance);
    mangonyInstance.templater = freemarkerTemplater;
    return freemarkerTemplater.initialize(mangonyInstance.options.cwd);
  },
};
export default FreemarkerTemplaterPlugin;
