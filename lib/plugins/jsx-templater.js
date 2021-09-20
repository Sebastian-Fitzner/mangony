const path = require('path');
const fs = require('fs-extra');
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
        const fileLoaders = Object.keys(this.context.data.types).filter(key => key !== 'data').map(type => {
            return loader.getFiles([
                `${process.cwd()}/${this.context.options.cwd}/${this.context.data.types[type].files}`
            ]);
        })

        Promise.all(fileLoaders).then(files => {
            const cleanedFiles = files.flat(Object.keys(this.context.data.types).length);

            this.bundle(cleanedFiles);

            if (this.options.compileStaticFiles) {
                this.renderPages();
            }
        }).catch(err => {
            console.log(chalk.red(`\n(!) Error when compiling initial files: \n`, JSON.stringify(err, null, 2), err));
        })

        this.bindEvents();
    }

    bindEvents() {
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
        events.registerEvent(this.context.evtNamespace + this.context.events.commons.add, createRendering('commons'));
        events.registerEvent(this.context.evtNamespace + this.context.events.commons.changed, createRendering('commons'));

        // Cleanup
        [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
            process.on(eventType, this.cleanupTempDir.bind(this));
        })
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
    renderTemplate({pageContent, page, data}) {
        this.bundleFile({
            file: page,
            type: 'pages'
        })
        const getLayout = () => `${process.cwd()}/${this.context.options.cwd}/.mangony/${path.relative(this.context.options.cwd, data.__layouts[data.layout].dirname) + '/' + data.__layouts[data.layout].id}.js`;
        const getPage = () => `${process.cwd()}/${this.context.options.cwd}/.mangony/${page.id}`;

        const mergedData = {root: data, context: data[data.contextData]};
        const compiledPage = requireUncached(getPage());
        const maybeWithLayout = data.layout ? requireUncached(getLayout()) : null;

        const withLayout = maybeWithLayout ? maybeWithLayout.default : (cmp) => (data) => cmp(data);
        const maybeInitialPageProps = compiledPage.getStaticProps ? compiledPage.getStaticProps(mergedData) : Promise.resolve({});
        const maybeInitialLayoutProps = maybeWithLayout?.getStaticProps ? maybeWithLayout.getStaticProps(mergedData) : Promise.resolve({});

        return Promise.all([maybeInitialPageProps, maybeInitialLayoutProps])
            .then(([initialPageProps, initialLayoutProps]) => {
                const initialProps = {
                    ...initialLayoutProps,
                    ...initialPageProps,
                };

                return this.options.renderFn(withLayout(compiledPage.default)({...mergedData, initialProps}));
            })
    }

    bundleFile({file}) {
        const entryPoint = `${process.cwd()}/${file.dirname}/${file.basename}`;
        const outfile = `${process.cwd()}/${this.context.options.cwd}/.mangony/${path.relative(this.context.options.cwd, file.dirname)}/${file.filename}.js`;

        this.bundle([entryPoint]);
        deleteCached(outfile);
    }

    bundle(entryPoint) {
        const bundled = esbuild.buildSync({
            bundle: false,
            platform: 'node',
            format: 'cjs',
            entryPoints: entryPoint,
            outdir: `${process.cwd()}/${this.context.options.cwd}/.mangony/`,
            outbase: `${process.cwd()}/${this.context.options.cwd}`,
        })

        if (bundled.errors.length) {
            console.error(`Error in bundling ${entryPoint.join(', ')}: `, JSON.stringify(bundled.errors, null, 2));
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
