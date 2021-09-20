'use strict';

require('mocha');
var chai = require('chai');
var fsx = require('fs-extra');
var Handlebars = require('handlebars');
var expect = chai.expect;
var Mangony = require('../index');
const templaterPlugin = require('../lib/plugins/hbs-templater');
var options = require('./support/options-factory')();
var app;

describe('mangony.templater', function () {
	beforeEach(function () {
		app = new Mangony(options);

		return app.render()
			.then(() => app.use(templaterPlugin, {
				helpers: [
					'helpers/*.js'
				]
			}))
	});


	describe('template engine', function () {
		it('should be handlebars', function () {
			expect(app.templater.engine).to.be.an('object');
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
			let globalData = {
				"globalTitle": "b"
			};
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
				cache: globalData
			}).then(() => {
				let content = fsx.readFileSync(pageFileData.destDir + '/' + pageFileData.destFile, 'utf8');

				expect(globalData).to.deep.equal({"globalTitle": "b"});
				expect(content).equal('b');
			});
		});

		it('should render a simple page with a YFM layout', function () {
			let data = {
				"a": {
					"a": "test"
				},
				"__layouts": {
					"lyt-docu": {
						"id": "lyt-docu",
						"parsed": {
							"content": "\r\n\t\t{{{yield}}}\r\n\t"
						}
					}
				},
				"pages": {
					"globals/test-partial": {
						"id": "globals/test-partial",
						"assets": "../",
						"ext": ".html",
						"srcExt": ".hbs",
						"basename": "test-partial.hbs",
						"filename": "test-partial",
						"dirname": "test\\fixtures\\partials\\globals",
						"destDir": "test/expected/",
						"destSubDir": "globals",
						"destFile": "globals/test-partial.html",
						"serverFile": "globals/test-partial",
						"raw": "---\r\ntestPartial: test partial\r\ncontextData: a\r\nlayout: \"lyt-docu\"\r\n---\r\n{{! ---\r\ngeneral: s-tester\r\n============================================\r\n\r\nRequirements:\r\n- (only hbs)\r\n\r\nOptions:\r\n- testerClasses {String} - Modifier classes\r\n\r\nImportant Notes:\r\n\r\n--- }}\r\n<div class=\"s-tester{{#if testerClasses}} {{testerClasses}}{{/if}}\"\r\n     data-js-module=\"tester\"\r\n     data-js-options=\"{ &quot;test&quot;:  &quot;testing&quot;}\">\r\n\t<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>\r\n\t<strong>\r\n\t\t{{a}}\r\n\t</strong>\r\n</div>\r\n",
						"parsed": {
							"orig": "---\r\ntestPartial: test partial\r\ncontextData: a\r\nlayout: \"lyt-docu\"\r\n---\r\n{{! ---\r\ngeneral: s-tester\r\n============================================\r\n\r\nRequirements:\r\n- (only hbs)\r\n\r\nOptions:\r\n- testerClasses {String} - Modifier classes\r\n\r\nImportant Notes:\r\n\r\n--- }}\r\n<div class=\"s-tester{{#if testerClasses}} {{testerClasses}}{{/if}}\"\r\n     data-js-module=\"tester\"\r\n     data-js-options=\"{ &quot;test&quot;:  &quot;testing&quot;}\">\r\n\t<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>\r\n\t<strong>\r\n\t\t{{a}}\r\n\t</strong>\r\n</div>\r\n",
							"data": {
								"testPartial": "test partial",
								"layout": "lyt-docu"
							},
							"content": "Lorem {{a.a}}"
						}
					}
				}
			};

			return app.templater.renderOne({
				page: data.pages['globals/test-partial'],
				cache: data
			}).then(() => {
				let content = fsx.readFileSync(data.pages['globals/test-partial'].destDir + '/' + data.pages['globals/test-partial'].destFile, 'utf8');

				expect(content).equal('Lorem test');
			});
		});

		it('should render a simple page with a YFM context data', function () {
			let data = {
				"a": {
					"a": "test"
				},
				"__layouts": {
					"lyt-docu": {
						"id": "lyt-docu",
						"parsed": {
							"content": "\r\n\t\t{{{yield}}}\r\n\t"
						}
					}
				},
				"pages": {
					"globals/test-partial": {
						"id": "globals/test-partial",
						"assets": "../",
						"ext": ".html",
						"srcExt": ".hbs",
						"basename": "test-partial.hbs",
						"filename": "test-partial",
						"dirname": "test\\fixtures\\partials\\globals",
						"destDir": "test/expected/",
						"destSubDir": "globals",
						"destFile": "globals/test-partial.html",
						"serverFile": "globals/test-partial",
						"raw": "---\r\ntestPartial: test partial\r\ncontextData: a\r\nlayout: \"lyt-docu\"\r\n---\r\n{{! ---\r\ngeneral: s-tester\r\n============================================\r\n\r\nRequirements:\r\n- (only hbs)\r\n\r\nOptions:\r\n- testerClasses {String} - Modifier classes\r\n\r\nImportant Notes:\r\n\r\n--- }}\r\n<div class=\"s-tester{{#if testerClasses}} {{testerClasses}}{{/if}}\"\r\n     data-js-module=\"tester\"\r\n     data-js-options=\"{ &quot;test&quot;:  &quot;testing&quot;}\">\r\n\t<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>\r\n\t<strong>\r\n\t\t{{a}}\r\n\t</strong>\r\n</div>\r\n",
						"parsed": {
							"orig": "---\r\ntestPartial: test partial\r\ncontextData: a\r\nlayout: \"lyt-docu\"\r\n---\r\n{{! ---\r\ngeneral: s-tester\r\n============================================\r\n\r\nRequirements:\r\n- (only hbs)\r\n\r\nOptions:\r\n- testerClasses {String} - Modifier classes\r\n\r\nImportant Notes:\r\n\r\n--- }}\r\n<div class=\"s-tester{{#if testerClasses}} {{testerClasses}}{{/if}}\"\r\n     data-js-module=\"tester\"\r\n     data-js-options=\"{ &quot;test&quot;:  &quot;testing&quot;}\">\r\n\t<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>\r\n\t<strong>\r\n\t\t{{a}}\r\n\t</strong>\r\n</div>\r\n",
							"data": {
								"testPartial": "test partial",
								"contextData": "a",
								"layout": "lyt-docu"
							},
							"content": "Lorem {{a.a}}"
						}
					}
				}
			};

			return app.templater.renderOne({
				page: data.pages['globals/test-partial'],
				cache: data
			}).then(() => {
				let content = fsx.readFileSync(data.pages['globals/test-partial'].destDir + '/' + data.pages['globals/test-partial'].destFile, 'utf8');

				expect(content).equal('Lorem test');
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
