require('@babel/register')({
	presets: [
		'@babel/preset-env',
		'@babel/preset-react'
	]
});

var Mangony = require('./index');
var TemplaterPlugin = require('./lib/plugins/jsx-templater');

var mangony = new Mangony({
	allow: {
		YFMContextData: true
	},
	cwd: 'test/fixtures/',
	dest: 'test/expected/jsx',
	exportData: true,
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
			dir: 'jsx',
			files: [
				'**/*.jsx',
				'**/*.md'
			]
		}
	},
	watch: true
});

mangony.render()
	.then(() => mangony.use(TemplaterPlugin));
