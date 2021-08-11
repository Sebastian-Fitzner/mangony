module.exports = function optionsFactory(customOptions) {
	var defaults = {
		assets: '', // Assets directory
		cwd: 'test/fixtures/hbs',
		debug: false,
		dest: 'test/expected',
		exportData: true, // Export the complete data stack as JSON file
		ext: '.html', // Extension of destination files
		flatten: false, // Flatten the destination directory
		types: { // All standard types should be defined in here
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
