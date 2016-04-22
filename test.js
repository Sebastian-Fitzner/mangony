var Mangony = require('./index');

var mangony = new Mangony({
	cwd: 'test/fixtures/',
	types: {
		data: {
			dir: 'data',
			files: [
				'/**/*'
			]
		},
		partials: {
			dir: 'partials',
			files: [
				'/**/*.hbs'
			]
		},
		pages: {
			dir: 'pages',
			files: [
				'/**/*.hbs'
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
	watch: true
});

mangony.compile();