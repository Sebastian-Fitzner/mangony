var Mangony = require('../index');
var TemplaterPlugin = require('../lib/plugins/jsx-templater');
var ServerPlugin = require('../index').plugins.serverPlugin;
var express = require('express');
const React = require('react');
const ReactDomServer = require('react-dom/server');

var mangony = new Mangony({
	cwd: 'test/fixtures/jsx',
	dest: 'test/expected/jsx',
	exportData: false,
	ext: '.html',
	flatten: true,
	collections: [
		'sitemap', 'components'
	],
	types: {
		data: {
			dir: 'data',
			files: [
				'**/*.json',
				'**/*.hjson'
			]
		},
		pages: {
			dir: '',
			files: [
				'pages/**/*.jsx',
				'partials/**/*.jsx'
			]
		},
		layouts: {
			dir: 'layouts',
			files: [
				'**/*.tsx'
			]
		},
		partials: {
			dir: 'partials',
			files: [
				'**/*.tsx',
				'**/*.jsx'
			]
		}
	},
	watch: true
});

mangony.render()
	.then(() => mangony.use(TemplaterPlugin, {
		compileStaticFiles: false,
	}))
	.then(() => mangony.use(ServerPlugin, {
		express: express(),
		logSnippet: false,
		bsEnabled: true,
		injectScript: true,
		useExt: true,
		start: true,
		port: 3000,
		usePort: true,
		useAssetsDir: false,
		bsOptions: {}
	}));
