'use strict';

require('mocha');
var expect = require('chai').expect;
var path = require('path');
var Mangony = require('../index');
var Helpers = require('../lib/utils/helpers');
var options = require('./support/options-factory')();
var app;

describe('Helpers', function () {
	beforeEach(function () {
		app = new Mangony(options);
	});

	it('get the file name', function () {
		let data = 'test/dummy/test.hjson';
		let file = Helpers.getFilename(data);

		expect(file).to.be.a('string');
		expect(file).to.equal('test');
	});

	it('verifying the usage of slash at the end of the file path', function () {
		let dataWithSlash = 'test/dummy/';
		let dataWithOutSlash = 'test/dummy';
		let fileWithSlash = Helpers.endsWithSlash(dataWithSlash);
		let fileWithOutSlash = Helpers.endsWithSlash(dataWithOutSlash);

		expect(fileWithSlash).to.be.true;
		expect(fileWithOutSlash).to.be.false;
	});

	it('verifying the usage of slash at the start of the file path', function () {
		let dataWithSlash = '/test/dummy/';
		let dataWithOutSlash = 'test/dummy';
		let fileWithSlash = Helpers.startsWithSlash(dataWithSlash);
		let fileWithOutSlash = Helpers.startsWithSlash(dataWithOutSlash);

		expect(fileWithSlash).to.be.true;
		expect(fileWithOutSlash).to.be.false;
	});

	it('should normalize the path', function () {
		let data = 'test\\dummy\\test.hjson';
		let file = Helpers.pathNormalize(data);

		expect(file).to.be.a('string');
		expect(file).to.equal('test/dummy/test.hjson');
	});

	it('should prepare a path for id', function () {
		let data = '\\test\\dummy\\test.hjson';
		let file = Helpers.preparePathForId(data);

		expect(file).to.be.a('string');
		expect(file).to.equal('test/dummy/test.hjson');
	});

	it('should get the destination directory', function () {
		let data = '\\test\\dummy\\test.hjson';
		let file = Helpers.getDestDir(data, '/test');

		expect(file).to.be.a('string');
		expect(file).to.equal(path.normalize('/dummy/test.hjson'));
	});

	it('should build a relative path', function () {
		let data = '/test/dummy/test.hjson';
		let data2 = '/test';
		let file = Helpers.buildPath({
			srcPath: data,
			typePath: data2
		});

		expect(file).to.be.a('string');
		expect(file).to.equal('dummy');
	});

	it('should build a custom id', function () {
		let data = {
			srcPath: '/test/dummy/test.hjson',
			typePath: '/test',
			file: 'test'
		};
		let data2 = {
			srcPath: '/test/dummy/test.hjson',
			typePath: '/test/dummy',
			file: 'test'
		};

		let id = Helpers.buildId(data);
		let id2 = Helpers.buildId(data2);

		expect(id).to.be.a('string');
		expect(id).to.equal('dummy/test');
		expect(id2).to.be.a('string');
		expect(id2).to.equal('test');
	});

	it('should clean up a custom id', function () {
		let data = {
			pathDelimiter: '_',
			srcPath: '/test/dummy/test.hjson',
			typePath: '/test',
			file: 'test'
		};
		let id = Helpers.cleanId(data);

		expect(id).to.be.a('string');
		expect(id).to.equal('dummy_test');
	});

	it('should create an assets path', function () {
		let path = Helpers.assetsPath('app', 'app');
		let path2 = Helpers.assetsPath('app/sub/sub', 'app');
		let path3 = Helpers.assetsPath('app/sub', 'app/assets');

		expect(path).to.equal('./');
		expect(path2).to.equal('../../');
		expect(path3).to.equal('../assets/');
	});
});