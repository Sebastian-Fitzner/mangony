var Mangony = require('./index');
var TemplaterPlugin = require('./lib/plugins/hbs-templater');

var mangony = new Mangony({
	allow: {
		YFMContextData: true,
		YFMLayout: true
	},
	cwd: 'test/fixtures/',
	dest: 'test/expected',
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
			dir: 'pages',
			files: [
				'**/*.hbs',
				'**/*.md'
			]
		},
		partials: {
			dir: 'partials',
			files: [
				'**/*.hbs'
			]
		},
		layouts: {
			dir: 'layouts',
			files: [
				'**/*.hbs'
			]
		}
	},
	watch: true
});

mangony.render()
	.then(() => mangony.use(TemplaterPlugin, {
			helpers: [
				'test/fixtures/helpers/*.js'
			]
		})
	);
