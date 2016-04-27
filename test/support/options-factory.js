module.exports = function optionsFactory(customOptions) {
	var defaults = {
		cwd: 'fixtures/',
		dest: 'expected',
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
		watch: false
	};

	var custom = defaults;
	var val;

	for (val in customOptions) {
		if (customOptions.hasOwnProperty(val)) {
			custom[val] = customOptions[val];
		}
	}

	return custom;
};
