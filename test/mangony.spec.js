'use strict';


require('mocha');
var expect = require('chai').expect;
var Mangony = require('../index');
var Data = require('../lib/modules/data');
const loader = require('../lib/utils/loader');
var options = require('./support/options-factory')();
var app;

describe('Mangony', function () {

	describe('defaults', function () {
		beforeEach(function () {
			app = new Mangony(options);
		});

		it('should create instance of data', function () {
			expect(app.data).to.be.an('object');
			expect(app.data).to.an.instanceof(Data);
		});

		it('should create a data object from page which can be used in rendering process', function () {
			let path = app.options.cwd + app.options.types.pages.dir + '/' + 'a.hbs';
			let type = 'pages';

			return loader.readFile(path)
				.then((data) => {
					return app.createData({
						path: path,
						type: type,
						data: data
					});
				})
				.then((data) => {
					expect(data.id).to.equal('a');
					expect(data.assets).to.equal('./');
					expect(data.ext).to.equal('.html');
					expect(data.srcExt).to.equal('.hbs');
					expect(data.basename).to.equal('a.hbs');
					expect(data.filename).to.equal('a');
					expect(data.dirname).to.equal('test/fixtures/pages');
					expect(data.destDir).to.equal(app.dest);
					expect(data.destSubDir).to.equal('');
					expect(data.destFile).to.equal('a.html');
					expect(data.serverFile).to.equal('a');
					expect(data.parsed.data.title).to.equal('a');
					expect(data.parsed.data.menuLink).to.equal('A');
					expect(data.parsed.data.sortOrder).to.equal(2);
				});
		});
	});

});