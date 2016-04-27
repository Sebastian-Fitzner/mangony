'use strict';

require('mocha');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var expect = chai.expect;
var Mangony = require('../index');
var options = require('./support/options-factory')();
var app;

chai.use(chaiAsPromised);

describe('mangony.loader', function () {
	beforeEach(function () {
		app = new Mangony(options);
	});

	describe('getFiles()', function () {
		it('should load a single file and return the file as promise', function () {
			app.loader.getFiles('test/fixtures/data/a.json').then((result) => {
				expect(result).to.have.lengthOf(1);
				expect(result).to.be.an('array');
			});
		});

		it('should load all files in directory (globbing)', function () {
			app.loader.getFiles(['test/fixtures/data/**/*']).then((result) => {
				expect(result).to.have.lengthOf(4);
				expect(result).to.be.an('array');
			});
		});

		it('should load a all files in directory (globbing) and single file', function () {
			app.loader.getFiles(['test/fixtures/data/*', 'test/fixtures/data/deep-data/d.hjson']).then((result) => {
				expect(result).to.have.lengthOf(4);
				expect(result).to.be.an('array');
			});
		});
	});

	describe('readFile()', function () {
		it('should read and parse a single json/hjson file', function () {
			app.loader.readFile({
				path: 'test/fixtures/data/deep-data/d.hjson'
			}).then((result) => {
				expect(result).to.be.an('object');
				expect(result.ext).is.equal('.hjson');
				expect(result.file).is.equal('d');
				expect(result.parsed.d).is.equal('d');
			});
		});

		it('should read and parse a single page file', function () {
			app.loader.readFile({
				path: 'test/fixtures/pages/index.hbs'
			}).then((result) => {
				expect(result).to.be.an('object');
				expect(result.ext).is.equal('.hbs');
				expect(result.file).is.equal('index');
				expect(result.parsed.data.title).is.equal('Index Title');
			});
		});

		it('should read and parse a single partial file', function () {
			app.loader.readFile({
				path: 'test/fixtures/partials/globals/test-partial.hbs'
			}).then((result) => {
				expect(result).to.be.an('object');
				expect(result.ext).is.equal('.hbs');
				expect(result.file).is.equal('test-partial');
				expect(result.parsed.data.testPartial).is.equal('my custom string');
			});
		});
	});
});