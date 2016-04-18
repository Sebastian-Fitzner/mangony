var Mangony = require('./lib/mangony');

var mangony = new Mangony({
	cwd: 'test/fixtures',
	types: {
		data: [
			'data/**/*'
		],
		partials: [
			'partials/**/*.hbs'
		],
		pages: [
			'pages/**/*.hbs'
		],
		layouts: [
			'layouts/**/*.hbs'
		]
	},
	helpers: [
		'helpers/*.js'
	]
});