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
const deepExtend = require('deep-extend');
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
		for (let key in item) obj[ key ] = item[ key ];
	});
	return obj;
};

Helpers.deepExtend = deepExtend;


/**
 *
 */
Helpers.fileExists = function fileExists(filepath) {
	return new Promise((resolve, reject) => {
		fsx.stat(filepath, (err, stat) => {
			if (err) {
				resolve(false);
			}

			if (stat) {
				resolve(true)
			} else {
				resolve(false);
			}
		});
	})
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
 * @param {String} str - File path
 */
Helpers.endsWithSlash = function (str) {
	let urlString = Helpers.pathNormalize(str);

	return urlString.endsWith('/');
};

Helpers.startsWithSlash = function (str) {
	let urlString = Helpers.pathNormalize(str);

	return urlString.startsWith('/');
};

Helpers.pathNormalize = function (urlString) {
	if (global.Mangony.platform === 'win32') {
		return urlString.replace(/\\/g, '/');
	} else {
		return urlString;
	}
};

Helpers.preparePathForId = function (str) {
	let urlString = Helpers.pathNormalize(str);

	return Helpers.startsWithSlash(str) ? urlString.substring(1) : urlString;
};

/**
 * Return destination directory
 *
 * @param {String} srcPath - Source path
 * @param {String} cwd - Current working directory
 */
Helpers.getDestDir = function (srcPath, cwd) {
	return path.normalize(srcPath).replace(path.normalize(cwd), '');
};

Helpers.buildPath = function (obj) {
	return Helpers.preparePathForId(path.dirname(Helpers.getDestDir(obj.srcPath, obj.typePath)));
};


Helpers.buildId = function (obj) {
	let buildPath = Helpers.buildPath(obj);

	if (buildPath !== '') {
		return buildPath + '/' + obj.file;
	} else {
		return obj.file;
	}
};

Helpers.cleanId = function (obj) {
	let pathDelimiter = obj.pathDelimiter || '/';

	return Helpers.buildId(obj).replace(/\//g, pathDelimiter);
};

Helpers.assetsPath = function (from, to) {
	let relativePath = path.relative(Helpers.pathNormalize(from), Helpers.pathNormalize(to));

	return relativePath === '' ? './' : Helpers.pathNormalize(relativePath) + '/';
};

module.exports = Helpers;