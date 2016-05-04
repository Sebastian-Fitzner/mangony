var Mangony = require('./index');

var mangony = new Mangony({
	cwd: 'test/fixtures/',
	dest: 'test/expected',
	types: {
		data: {
			dir: 'data',
			files: [
				'/**/*.json',
				'/**/*.hjson'
			]
		},
		partials: {
			dir: '',
			files: [
				'partials/**/*.hbs',
				'data/**/*.md'
			]
		},
		pages: {
			dir: 'pages',
			files: [
				'/**/*.hbs',
				'/**/*.md'
			]
		},
		layouts: {
			dir: 'layouts',
			files: [
				'/**/*.hbs'
			]
		}
	},
	helpers: [
		'helpers/*.js'
	],
	watch: true,
	flatten: false
});

mangony.compile();