module.exports = function optionsFactory(customOptions) {
	var defaults = {
		allow: {
			YFMLayout: false,
			YFMContextData: false
		},
		assets: '', // Assets directory
		compileStaticFiles: true,
		cwd: 'test/fixtures/hbs',
		debug: false,
		dest: 'test/expected',
		devServer: {
			start: false,
			port: 3000,
			express: false
		},
		exportData: true, // Export the complete data stack as JSON file
		ext: '.html', // Extension of destination files
		flatten: false, // Flatten the destination directory
		helpers: [
			'helpers/*.js'
		], // Custom helpers files - globbing supported (example: 'helpers/*.js')
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
