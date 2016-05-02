'use strict';

require('mocha');
var chai = require("chai");
var expect = chai.expect;
var Mangony = require('../index');
var options = require('./support/options-factory')();
var app;

describe('mangony.loader', function () {
	beforeEach(function () {
		app = new Mangony(options);
	});

	describe('getFiles()', function () {
		it('should load a single file and return the file as promise', function () {
			app.loader.getFiles('test/fixtures/data/a.json').then((result) => {
				expect(result).to.be.an('array');
				expect(result).to.have.lengthOf(1);
			});
		});

		it('should load all files in directory (globbing)', function () {
			app.loader.getFiles(['test/fixtures/data/**/*']).then((result) => {
				expect(result).to.be.an('array');
				expect(result).to.have.lengthOf(4);
			});
		});

		it('should load a all files in directory (globbing) and single file', function () {
			app.loader.getFiles(['test/fixtures/data/*', 'test/fixtures/data/deep-data/d.hjson']).then((result) => {
				expect(result).to.be.an('array');
				expect(result).to.have.lengthOf(4);
			});
		});
	});

	describe('readFile()', function () {
		it('should read and parse a single json/hjson file', function () {
			app.loader.readFile({
				srcPath: 'test/fixtures/data/deep-data/d.hjson'
			}).then((result) => {
				expect(result).to.be.an('object');
				expect(result.ext).is.equal('.hjson');
				expect(result.filename).is.equal('d');
				expect(result.parsed.d).is.equal('d');
			});
		});

		it('should read and parse a single page file', function () {
			app.loader.readFile({
				srcPath: 'test/fixtures/pages/index.hbs'
			}).then((result) => {
				expect(result).to.be.an('object');
				expect(result.ext).is.equal('.hbs');
				expect(result.filename).is.equal('index');
				expect(result.parsed.data.title).is.equal('Index Title');
			});
		});

		it('should read and parse a single partial file', function () {
			app.loader.readFile({
				srcPath: 'test/fixtures/partials/globals/test-partial.hbs'
			}).then((result) => {
				expect(result).to.be.an('object');
				expect(result.ext).is.equal('.hbs');
				expect(result.filename).is.equal('test-partial');
				expect(result.parsed.data.testPartial).is.equal('my custom string');
			});
		});
	});
});