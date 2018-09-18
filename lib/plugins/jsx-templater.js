const deepMerge = require('deepmerge');
const React = require('react');
const ReactDomServer = require('react-dom/server');
const Templater = require('../modules/templater');
const events = require('../utils/events');
const babel = require('@babel/core');

class JSXTemplater extends Templater {
	constructor(opts, context) {
		let options = {
			compileStaticFiles: true
		};

		super(deepMerge(options, opts || {}));

		this.context = context;
	}

	initialize() {
		this.bindEvents();
	}

	bindEvents() {
		events.registerEvent(this.context.evtNamespace + this.context.events.cache.updated, ({page}) => {
			this.renderOne({
				page,
				cache: this.context.data.cache
			})
		});

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

		let code = babel.transform(pageContent, {
			presets: [
				'@babel/preset-env',
				'@babel/preset-react'
			],
			plugins: [
				'@babel/plugin-transform-react-jsx'
			]
		}).code;

		console.log('code: ', code);


		// const transpile = eval(code)();
		// console.log('transpile(data): ', transpile);
		let pageSrcExt = page.srcExt || '';
		let template = ReactDomServer.renderToStaticMarkup(eval(code));

		console.log('template: ', template);

		return template;

		// return pageSrcExt === '.md' ? md.render(template) : template;
	}
}

const JSXTemplaterPlugin = {
	pluginName: 'Templater',
	initialize: function (mangonyInstance, opts) {
		const jsxTemplater = new JSXTemplater(opts, mangonyInstance);
		mangonyInstance.templater = jsxTemplater;

		return jsxTemplater.initialize();
	}
};

module.exports = JSXTemplaterPlugin;