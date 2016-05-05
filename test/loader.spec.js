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
			app.loader.readFile('test/fixtures/data/deep-data/d.hjson').then((result) => {
				expect(result).to.be.an('object');
				expect(result.parsedData.d).is.equal('d');
			});
		});

		it('should read and parse a single page file', function () {
			app.loader.readFile('test/fixtures/pages/index.hbs').then((result) => {
				expect(result).to.be.an('object');
				expect(result.parsedData.data.title).is.equal('Index Title');
			});
		});

		it('should read and parse a single partial file', function () {
			app.loader.readFile('test/fixtures/partials/globals/test-partial.hbs').then((result) => {
				expect(result).to.be.an('object');
				expect(result.parsedData.data.testPartial).is.equal('test partial');
			});
		});
	});
});