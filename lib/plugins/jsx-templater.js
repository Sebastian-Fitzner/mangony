const path = require('path');
const chalk = require('chalk');
const deepMerge = require('deepmerge');
const ReactDomServer = require('react-dom/server');
const esbuild = require('esbuild');
const Templater = require('../modules/templater');
const loader = require('../utils/loader');
const events = require('../utils/events');

function deleteCached(module) {
    try {
        delete require.cache[require.resolve(module)];
    } catch (e) {
        console.info(chalk.yellow(`${module} could not be deleted from cache!`));
    }
}

function requireUncached(module) {
    deleteCached(module);
    return require(module);
}

class JSXTemplater extends Templater {
    constructor(opts, context) {
        let options = {
            compileStaticFiles: false,
            renderFn: ReactDomServer.renderToString
        };

        super(deepMerge(options, opts || {}));

        this.context = context;
    }

    initialize() {
        this.bindEvents();
    }

    bindEvents() {
        // Render all pages when layout, partial was changed
        let createRendering = (type) => obj => {
            loader.readFile(obj.file)
                .then((data) => {
                    return this.context.createData({
                        path: obj.file,
                        type,
                        data
                    });
                })
                .then((data) => {
                    let dataObj = {
                        type,
                        id: data.id,
                        data
                    };

                    this.context.preRenderTime(`${obj.evt}::${type}`);

                    if (obj.evt === 'add') {
                        this.context.data.addToCache(dataObj);
                    } else {
                        this.context.data.replaceInCache(dataObj);
                    }

                    return this.context.data.cache[`__${type}`][data.id];
                })
                .then((data) => {
                    this.context.writeDataFile();

                    return this.bundleFile({
                        file: data,
                        type
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

                    this.context.postRenderTime(`${obj.evt}::${type}`);
                    this.context.triggerReload();
                })
                .catch(function (err) {
                    console.log(chalk.red(`\n(!) Error when ${type} has changed: \n`, JSON.stringify(obj, null, 2), err));
                });
        };

        events.registerEvent(this.context.evtNamespace + this.context.events.pages.changed, ({page}) => {
            this.context.preRenderTime('change::pages');
            this.renderOne({
                page,
                cache: this.context.data.cache
            })
            this.context.postRenderTime('change::pages');
        });
        events.registerEvent(this.context.evtNamespace + this.context.events.partials.add, createRendering('partials'));
        events.registerEvent(this.context.evtNamespace + this.context.events.partials.changed, createRendering('partials'));
        events.registerEvent(this.context.evtNamespace + this.context.events.layouts.add, createRendering('layouts'));
        events.registerEvent(this.context.evtNamespace + this.context.events.layouts.changed, createRendering('layouts'));
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
    renderTemplate({pageContent, page, data}) {
        this.bundleFile({
            file: page,
            type: 'pages'
        })

        const pagePath = `${process.cwd()}/${this.context.options.cwd}/.mangony/${page.id}`;
        const compiledPage = requireUncached(`${pagePath}`);
        const withLayout = data.layout ?
            requireUncached(`${process.cwd()}/${this.context.options.cwd}/.mangony/${path.relative(this.context.options.cwd, data.__layouts[data.layout].dirname) + '/' + data.__layouts[data.layout].id}.js`).default :
            (cmp) => (data) => cmp(data);

        return this.options.renderFn(withLayout(compiledPage.default)({root: data, context: data[data.contextData]}));
    }

    bundleFile({file, type}) {
        const entryPoint = `${process.cwd()}/${file.dirname}/${file.basename}`;
        const outfile = `${process.cwd()}/${this.context.options.cwd}/.mangony/${path.relative(this.context.options.cwd, file.dirname)}/${file.filename}.js`;

        deleteCached(outfile);

        const bundled = esbuild.buildSync({
            bundle: false,
            platform: 'node',
            format: 'cjs',
            entryPoints: [entryPoint],
            outfile,
        })

        if (bundled.errors.length) {
            console.error(`Error in bundling ${entryPoint}: `, JSON.stringify(bundled.errors, null, 2));
        }

        return bundled;
    }
}

const JSXTemplaterPlugin = {
    pluginName: 'Templater',
    initialize: function (mangonyInstance, opts) {
        const jsxTemplater = new JSXTemplater(opts, mangonyInstance);
        mangonyInstance.templater = jsxTemplater;

        jsxTemplater.initialize();
        return mangonyInstance;
    }
};

module.exports = JSXTemplaterPlugin;
