'use strict';

require('mocha');
var chai = require('chai');
var fsx = require('fs-extra');
var Handlebars = require('handlebars');
var expect = chai.expect;
var Mangony = require('../index');
var options = require('./support/options-factory')();
var app;

describe('mangony.templater', function () {
	beforeEach(function () {
		app = new Mangony(options);
	});


	describe('template engine', function () {
		it('should be handlebars', function () {
			expect(app.templater.engine).to.be.an('object');
			expect(app.templater.engine).to.equal(Handlebars);
		});
	});

	describe('rendering process', function () {
		it('should render a simple page with html content', function () {
			let pageFileData = {
				"id": "a",
				"assets": "./",
				"ext": ".html",
				"srcExt": ".hbs",
				"basename": "a.hbs",
				"filename": "a",
				"dirname": "test/fixtures/pages",
				"destDir": "test/expected/",
				"destSubDir": "",
				"destFile": "a.html",
				"parsed": {
					"data": {
						"title": "Build Better Prototypes with Veams"
					},
					"content": "a"
				}
			};

			return app.templater.renderOne({
				page: pageFileData
			}).then(() => {
				let content = fsx.readFileSync(pageFileData.destDir + '/' + pageFileData.destFile, 'utf8');

				expect(content).to.equal('a');
			});
		});

		it('should render a simple page with global data', function () {
			let pageFileData = {
				"id": "b",
				"assets": "./",
				"ext": ".html",
				"srcExt": ".hbs",
				"basename": "b.hbs",
				"filename": "b",
				"dirname": "test/fixtures/pages",
				"destDir": "test/expected/",
				"destSubDir": "",
				"destFile": "b.html",
				"parsed": {
					"data": {
						"title": "Build Better Prototypes with Veams"
					},
					"content": "{{globalTitle}}"
				}
			};

			return app.templater.renderOne({
				page: pageFileData,
				cache: {
					globalTitle: "b"
				}
			}).then(() => {
				let content = fsx.readFileSync(pageFileData.destDir + '/' + pageFileData.destFile, 'utf8');

				expect(content).to.equal('b');
			});
		});

		it('should render a simple page with local data', function () {
			let pageFileData = {
				"id": "c",
				"assets": "./",
				"ext": ".html",
				"srcExt": ".hbs",
				"basename": "c.hbs",
				"filename": "c",
				"dirname": "test/fixtures/pages",
				"destDir": "test/expected/",
				"destSubDir": "",
				"destFile": "c.html",
				"parsed": {
					"data": {
						"title": "c"
					},
					"content": "{{title}}"
				}
			};

			return app.templater.renderOne({
				page: pageFileData
			}).then(() => {
				let content = fsx.readFileSync(pageFileData.destDir + '/' + pageFileData.destFile, 'utf8');

				expect(content).to.equal('c');
			});
		});

		it('should render a markdown page with local data and handlebars', function () {
			let pageFileData = {
				"id": "md",
				"assets": "./",
				"ext": ".html",
				"srcExt": ".md",
				"basename": "md.md",
				"filename": "md",
				"dirname": "test/fixtures/pages",
				"destDir": "test/expected/",
				"destSubDir": "",
				"destFile": "md.html",
				"parsed": {
					"data": {
						"title": "md"
					},
					"content": "{{title}}"
				}
			};

			return app.templater.renderOne({
				page: pageFileData
			}).then(() => {
				let content = fsx.readFileSync(pageFileData.destDir + '/' + pageFileData.destFile, 'utf8');

				expect(content).to.equal('<p>md</p>\n');
			});
		});

		it('should render multiple pages', function () {
			let data = {
				"__repository": {
					"pages": [
						"a",
						"b",
						"c"
					]
				},
				"pages": {
					"a": {
						"id": "b",
						"assets": "./",
						"ext": ".html",
						"srcExt": ".hbs",
						"basename": "b.hbs",
						"filename": "b",
						"dirname": "test/fixtures/pages",
						"destDir": "test/expected/",
						"destSubDir": "",
						"destFile": "b.html",
						"parsed": {
							"data": {
								"title": "Build Better Prototypes with Veams"
							},
							"content": "{{globalTitle}}"
						}
					},
					"b": {
						"id": "b",
						"assets": "./",
						"ext": ".html",
						"srcExt": ".hbs",
						"basename": "b.hbs",
						"filename": "b",
						"dirname": "test/fixtures/pages",
						"destDir": "test/expected/",
						"destSubDir": "",
						"destFile": "b.html",
						"parsed": {
							"data": {
								"title": "Build Better Prototypes with Veams"
							},
							"content": "{{globalTitle}}"
						}
					},
					"c": {
						"id": "c",
						"assets": "./",
						"ext": ".html",
						"srcExt": ".hbs",
						"basename": "c.hbs",
						"filename": "c",
						"dirname": "test/fixtures/pages",
						"destDir": "test/expected/",
						"destSubDir": "",
						"destFile": "c.html",
						"parsed": {
							"data": {
								"title": "c"
							},
							"content": "{{title}}"
						}
					}
				}
			};

			return app.templater.renderAll({
				repository: data.__repository.pages,
				pages: data.pages,
				cache: {
					globalTitle: "Global Title"
				}
			}).then(() => {
				let contentA = fsx.readFileSync(app.options.dest + '/' + 'a' + app.options.ext, 'utf8');
				let contentB = fsx.readFileSync(app.options.dest + '/' + 'b' + app.options.ext, 'utf8');
				let contentC = fsx.readFileSync(app.options.dest + '/' + 'c' + app.options.ext, 'utf8');

				expect(contentA).to.equal('a');
				expect(contentB).to.equal('Global Title');
				expect(contentC).to.equal('c');
			});
		});
	});
});