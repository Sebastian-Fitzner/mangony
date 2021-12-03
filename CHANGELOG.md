### v2.0.0-alpha-20
- Add relateiveToBasePath support for pages

### v2.0.0-alpha-16
- Change jsx templater to bundle pages instead of compiling each file
- Ignore layouts in settings file for jsx

### v2.0.0-alpha-15
- Improve watcher logic for directory checks

### v2.0.0-alpha-13
- Add type definitions for TS projects

### v2.0.0-alpha-12
- Add ignore support
- Remove buffer from cache
- Replace multi-glob with globby

### v2.0.0-alpha-10
- Add JSX Templating support (React/Preact)

### v2.0.0-alpha
- Add plugin system
- Support different template engines like freemarker, handlebars and more

### v1.4.0
- Add browser-sync as option. 

### v1.3.4
- Add better watcher handling for file and folder existence. 

### v1.3.3
- Add directory check for watchers, because chokidar falls back to `cwd` which leads to multiple incremental builds and reloads per file. 

### v1.3.2
- Bugfix for major server rendering issue, when page is changed. 

### v1.3.1
- Add extension definition for single page by using page.settings.

### v1.3.0
- Add extension definition for single page by using YAML Front Matter.

### v1.2.2
- Fix bug in custom helper registration with path resolving included.

### v1.2.1
- Update mangony rendering process to support page.settings, and context merging.

### v1.1.16
- Update magnony-hbs-helper package version to support new helpers.

### v1.1.15
- Update assets path creation when flatten option is set.

### v1.1.14
- Add event namespace to support multiple watching instances at the same time.

### v1.1.13
- Add handlebars instance instead of using one global one (templater.js)

### v1.1.12
- Update mangony-hbs-helpers version

### v1.1.11
- Update templater.js to support manually added pages  to the cache without directory context and srcExt

### v1.1.10
- Add devServer.bsEnabled and devServer.useExt

### v1.1.9
- Bump versions

### v1.1.8
- Fix register route handling in watch mode

### v1.1.7
- Add injectScript option

### v1.1.6
- Add default port to bsOptions

### v1.1.5
- Update server.js port for browser-sync

### v1.1.3-v1.1.4
- Version handling of markdown-it plugins

### v1.1.2
- Update error messages in loader.js

### v1.1.1
- Clean up server.js in options handling
- Bump versions

### v1.1.0
- Add livereload (browser-sync) to development server
- Add options for livereload
- Add better event handling 

### v1.0.20
- Bugfix: deep IDs for partials and layouts in watch mode

### v1.0.19
- Bugfix: deep IDs for partials

### v1.0.18
- Update bindEvents() in mangony to support renaming of pages in watch mode without errors 

### v1.0.17
- Update packages
- Update Readme

### v1.0.16
- Add custom mangony helpers

### v1.0.15
- Add unpublish/publish flag for pages in YFM

### v1.0.14
- Add `basename` to `currentPage`

### v1.0.13
- Add multiple `{{{yield}}}` replacements

### v1.0.12
- Add `currentPage` data object to `@root`

### v.1.0.11
- Updated templater.js to support YFMLayout and Extended Layouts at the same time
