/**
 * Represents a helpers object.
 * @module helpers
 *
 * @author Sebastian Fitzner
 */

'use strict';

const Promise = require('bluebird');
const path = require('path');
const chalk = require('chalk');
const mkdirp = Promise.promisifyAll(require('mkdirp'));
const fsx = Promise.promisifyAll(require('fs-extra'));

const Helpers = {};

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

/**
 * Delete extension of file.
 *
 * @param {String} filename - Filename of file
 */
Helpers.deleteExtension = function (filename) {
	return filename.replace(/\.[^/.]+$/, '');
};

/**
 * Return the size of the array.
 *
 * @param {Array} arr - Array
 */
Helpers.size = function (arr) {
	return Object.keys(arr).length;
};

/**
 * Write a file and directories with Promises.
 *
 * @param {String} filepath - File path to which the file needs to be written
 * @param {String} data - Data which will be written.
 */
Helpers.write = function (filepath, data) {
	return mkdirp.mkdirPAsync(path.dirname(filepath))
		.then(() => {
			console.log(chalk.green('Writing ' + chalk.cyan(filepath) + ' ...'));
			return Helpers.writeFile(filepath, data);
		});
};

/**
 * Write a file with Promises.
 *
 * @param {String} filepath - File path to which the file needs to be written
 * @param {String} data - Data which will be written.
 */
Helpers.writeFile = function (filepath, data) {
	return fsx.writeFileAsync(filepath, data);
};

/**
 * Get the file name.
 *
 * @param {String} filepath - File path
 */
Helpers.getFilename = function (filepath) {
	return Helpers.deleteExtension(path.basename(filepath));
};

/**
 * Return boolean if there is a slash at the end of the file path.
 *
 * @param {String} filepath - File path
 */
Helpers.endsWithSlash = function (filepath) {
	return /[\\\/]$/.test(filepath);
};

/**
 * Return destination directory
 *
 * @param {String} srcPath - Source path
 * @param {String} cwd - Current working directory
 */
Helpers.getDestDir = function (srcPath, cwd) {
	return srcPath.replace(cwd, '');
};

module.exports = Helpers;