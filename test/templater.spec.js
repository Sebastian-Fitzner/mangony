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
				"ext": ".hbs",
				"file": "a",
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
				let content = fsx.readFileSync(app.options.dest + '/' + pageFileData.file + app.options.ext, 'utf8');

				expect(content).to.equal('a');
			});
		});

		it('should render a simple page with global data', function () {
			let pageFileData = {
				"ext": ".hbs",
				"file": "b",
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
					data: {
						globalTitle: "b"
					}
				}
			}).then(() => {
				let content = fsx.readFileSync(app.options.dest + '/' + pageFileData.file + app.options.ext, 'utf8');

				expect(content).to.equal('b');
			});
		});

		it('should render a simple page with local data', function () {
			let pageFileData = {
				"ext": ".hbs",
				"file": "c",
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
				let content = fsx.readFileSync(app.options.dest + '/' + pageFileData.file + app.options.ext, 'utf8');

				expect(content).to.equal('c');
			});
		});
	});
});