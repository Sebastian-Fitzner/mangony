'use strict';

var Promise = require('bluebird');
var path = require('path');
var chalk = require('chalk');
var mkdirp = Promise.promisifyAll(require('mkdirp'));
var fsx = Promise.promisifyAll(require('fs-extra'));

var Helpers = {};

/**
 * Simple extend method to extend the properties of an object.
 *
 * @param {Object} obj - object which will be extended
 *
 * @return {Object} obj - extended object
 */
Helpers.extend = function extend(obj) {
	[].slice.call(arguments, 1).forEach((item) => {
		for (let key in item) obj[key] = item[key];
	});
	return obj;
};


Helpers.cleanupPath = function (path) {
	if (path !== '') {
		return path.replace(/\/?$/, '/');
	}
};

Helpers.deleteExtension = function (filename) {
	return filename.replace(/\.[^/.]+$/, '');
};

Helpers.size = function (array) {
	return Object.keys(array).length;
};

Helpers.write = function (filepath, data) {
	return mkdirp.mkdirPAsync(path.dirname(filepath))
		.then(() => {
			return Helpers.writeFile(filepath, data);
		});
};

Helpers.writeFile = function (filepath, data) {
	return fsx.writeFileAsync(filepath, data).then(() => {
		return console.log(chalk.green('File ' + chalk.cyan(filepath) + ' successfully created.'));
	});
};

Helpers.getFilename = function (filepath) {
	return Helpers.deleteExtension(path.basename(filepath));
};

module.exports = Helpers;