module.exports = function optionsFactory(customOptions) {
	var defaults = {
		exportData: true,
		cwd: 'fixtures/',
		dest: 'test/expected',
		flatten: false,
		watch: false,
		ext: '.html',
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
		]
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
