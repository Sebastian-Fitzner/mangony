import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import deepMerge from 'deepmerge';
import * as ReactDomServer from 'react-dom/server';
import esbuild from 'esbuild';
import Templater from '../modules/templater.js';
import loader from '../utils/loader.js';
import events from '../utils/events.js';

class JSXTemplater extends Templater {
  constructor(opts, context) {
    let options = {
      compileStaticFiles: false,
      renderFn: ReactDomServer.renderToString,
      bundlerOptions: {
        external: ['react', 'react-dom'],
      },
    };
    super(deepMerge(options, opts || {}));
    this.context = context;
  }

  initialize() {
    const fileLoaders = Object.keys(this.context.data.types).filter(key => key === 'page').map(type => {
      return loader.getFiles([
        `${process.cwd()}/${this.context.options.cwd}/${this.context.data.types[type].files}`,
      ]);
    });
    Promise.all(fileLoaders).then(files => {
      const cleanedFiles = files.flat(Object.keys(this.context.data.types).length);
      this.bundle(cleanedFiles);
      if (this.options.compileStaticFiles) {
        this.renderPages();
      }
    }).catch(err => {
      console.log(chalk.red(`\n(!) Error when compiling initial files: \n`, JSON.stringify(err, null, 2), err));
    });
    this.bindEvents();
  }

  bindEvents() {
    let createRendering = (type) => obj => {
      loader.readFile(obj.file)
        .then((data) => {
          return this.context.createData({
            path: obj.file,
            type,
            data,
          });
        })
        .then((data) => {
          let dataObj = {
            type,
            id: data.id,
            data,
          };
          this.context.preRenderTime(`${obj.evt}::${type}`);
          if (obj.evt === 'add') {
            this.context.data.addToCache(dataObj);
          } else {
            this.context.data.replaceInCache(dataObj);
          }
          return this.context.data.cache[`__${type}`][data.id];
        })
        .then(() => {
          this.context.writeDataFile();
          if (this.options.compileStaticFiles) {
            this.preRenderPages();
            return this.renderPages();
          }
        })
        .then(() => {
          if (this.options.compileStaticFiles) {
            this.postRenderPages();
          }
          this.context.postRenderTime(`${obj.evt}::${type}`);
          this.context.triggerReload();
        })
        .catch(function(err) {
          console.log(chalk.red(`\n(!) Error when ${type} has changed: \n`, JSON.stringify(obj, null, 2), err));
          console.trace(err);
        });
    };
    events.registerEvent(this.context.evtNamespace + this.context.events.pages.changed, ({ page }) => {
      this.context.preRenderTime('change::pages');
      this.renderOne({
        page,
        cache: this.context.data.cache,
      });
      this.context.postRenderTime('change::pages');
    });
    events.registerEvent(this.context.evtNamespace + this.context.events.partials.add, createRendering('partials'));
    events.registerEvent(this.context.evtNamespace + this.context.events.partials.changed, createRendering('partials'));
    events.registerEvent(this.context.evtNamespace + this.context.events.layouts.add, createRendering('layouts'));
    events.registerEvent(this.context.evtNamespace + this.context.events.layouts.changed, createRendering('layouts'));
    events.registerEvent(this.context.evtNamespace + this.context.events.commons.add, createRendering('commons'));
    events.registerEvent(this.context.evtNamespace + this.context.events.commons.changed, createRendering('commons'));
    // Cleanup
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
      process.on(eventType, this.cleanupTempDir.bind(this));
    });
  }

  cleanupTempDir() {
    fs.removeSync(`${process.cwd()}/${this.context.options.cwd}/.mangony`);
    process.exit();
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
    this.bundleFile({
      file: page,
      type: 'pages',
    });
    const pageDir = this.context.options.types.pages.dir;
    const pagePath = path.join(pageDir, page.id);
    const getPage = () => `${process.cwd()}/${this.context.options.cwd}/.mangony/${pagePath}`;
    const mergedData = { root: data, context: data[data.contextData] };

    return import(`${getPage()}.js`).then(compiledPage => {
      const withLayout = (cmp) => (data) => {
        const fn = cmp.type && typeof cmp.type === 'function' ? cmp.type : cmp;
        return fn(data);
      };
      const maybeInitialPageProps = compiledPage.getStaticProps ? compiledPage.getStaticProps(mergedData) : Promise.resolve({});
      return Promise.all([maybeInitialPageProps])
        .then(([initialPageProps]) => {
          const initialProps = {
            ...initialPageProps,
          };
          const template = withLayout(compiledPage.default)({ ...mergedData, initialProps });
          return this.options.renderFn(template);
        });
    });
  }

  bundleFile({ file }) {
    const entryPoint = `${process.cwd()}/${file.dirname}/${file.basename}`;

    this.bundle([entryPoint]);
  }

  bundle(entryPoint) {
    const bundled = esbuild.buildSync({
      bundle: true,
      platform: 'node',
      format: 'esm',
      entryPoints: entryPoint,
      outdir: `${process.cwd()}/${this.context.options.cwd}/.mangony/`,
      outbase: `${process.cwd()}/${this.context.options.cwd}`,
      ...this.options.bundlerOptions,
    });
    if (bundled.errors.length) {
      console.error(`Error in bundling ${entryPoint.join(', ')}: `, JSON.stringify(bundled.errors, null, 2));
    }
    return bundled;
  }
}

const JSXTemplaterPlugin = {
  pluginName: 'Templater',
  initialize: function(mangonyInstance, opts) {
    const jsxTemplater = new JSXTemplater(opts, mangonyInstance);
    mangonyInstance.templater = jsxTemplater;
    jsxTemplater.initialize();
    return mangonyInstance;
  },
};
export default JSXTemplaterPlugin;
