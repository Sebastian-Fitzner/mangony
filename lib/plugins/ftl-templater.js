const deepMerge = require('deepmerge');
const Promise = require('bluebird');
const chalk = require('chalk');
const Freemarker = require('freemarker.js');
const path = require('path');
const Templater = require('../modules/templater');
const events = require('../utils/events');
const loader = require('../utils/loader');

class FreemarkerTemplater extends Templater {
	constructor(opts, context) {
		let options = {
			compileStaticFiles: false,
			viewRoot: ''
		};

		super(deepMerge(options, opts || {}));

		this.cwd = '';
		this.context = context;
	}

	initialize(cwd) {
		this.cwd = cwd;
		this.fm = new Freemarker({
			viewRoot: path.join(process.cwd(), `${this.cwd}`)
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
						data: data
					});
				})
				.then((data) => {
					let dataObj = {
						type: 'partials',
						id: data.id,
						data: data
					};

					this.context.preRenderTime('render_page');

					if (obj.evt === 'add') {
						this.context.data.addToCache(dataObj);
					} else {
						this.context.data.replaceInCache(dataObj);
					}

					return this.context.data.cache.__partials[ data.id ];
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
				.catch(function (err) {
					console.log(chalk.red('\n(!) Mangony :: FTL Templater - Error in rendering pages: \n', err));
				});
		};

		events.registerEvent(this.context.evtNamespace + this.context.events.cache.updated, ({ page }) => {
			this.renderOne({
				page,
				cache: this.context.data.cache
			})
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

		// Single template file
		return this.fm.renderSync(tplPath, data);
	}
}

const FreemarkerTemplaterPlugin = {
	pluginName: 'Templater',
	initialize: function (mangonyInstance, opts) {
		const freemarkerTemplater = new FreemarkerTemplater(opts, mangonyInstance);
		mangonyInstance.templater = freemarkerTemplater;

		return freemarkerTemplater.initialize(mangonyInstance.options.cwd);
	}
};

module.exports = FreemarkerTemplaterPlugin;
