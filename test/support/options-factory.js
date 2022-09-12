export default (function optionsFactory(customOptions) {
    var defaults = {
        assets: '',
        cwd: 'test/fixtures/hbs',
        debug: false,
        dest: 'test/expected',
        exportData: true,
        ext: '.html',
        flatten: false,
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
});
