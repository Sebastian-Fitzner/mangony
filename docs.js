var Mangony = require('./index');

var mangony = new Mangony({
	allow: {
		YFMContextData: true,
		YFMLayout: true
	},
	cwd: 'test/fixtures/',
	dest: 'test/expected',
	exportData: true,
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
		partials: {
			dir: 'partials',
			createDeepIds: false,
			files: [
				'**/*.hbs'
			]
		},
		pages: {
			dir: 'pages',
			files: [
				'**/*.hbs',
				'**/*.md'
			]
		},
		layouts: {
			dir: 'layouts',
			files: [
				'**/*.hbs'
			]
		}
	},
	helpers: [
		'helpers/*.js'
	],
	watch: true,
	compileStaticFiles: false,
	devServer: {
		useExt: false,
		start: true,
		port: 3000
	}
});

mangony.render();