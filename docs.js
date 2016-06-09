var Mangony = require('./index');

var mangony = new Mangony({
	allow: {
		YFMContextData: true,
		YFMLayout: true
	},
	cwd: 'test/fixtures/',
	dest: 'test/expected',
	exportData: true,
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
			files: [
				'**/*.hbs'
			]
		},
		pages: {
			dir: 'partials',
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
	flatten: false,
	compileStaticFiles: false,
	devServer: {
		start: true,
		port: 3001
	}
});

mangony.render();