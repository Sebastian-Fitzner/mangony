var Promise = require("bluebird");
var glob = Promise.promisifyAll(require('multi-glob'));
var fsx = Promise.promisifyAll(require('fs-extra'));
var matter = require('gray-matter');
var Helpers = require('../utils/helpers');

var Loader = {
	getFiles: getFiles,
	readFile: readFile
};

/**
 * Get all files with multi-glob and Promises.
 *
 * @param {Array} paths - Paths in array
 */

function getFiles(paths) {
	return glob.globAsync(paths, {nodir: true})
		.then(function (files) {
			return files;
		})
		.catch((err) => {
			console.log('error: ', err);
		})
}

/**
 * Returns async function that loads specified file.
 * @param {Object} obj - Object
 * @param {String} obj.dataHandler - data handler instance
 * @param {String} obj.path - Path to file
 * @param {String} obj.type - Type of file
 * @return {Object}
 */
function readFile(obj) {
	var file = Helpers.deleteExtension(obj.path.substr(obj.path.lastIndexOf('/') + 1));

	return fsx.readFileAsync(obj.path, 'utf8')
		.then((data) => {
			return {
				file: file,
				raw: data,
				parsed: matter(data)
			};
		})
		.catch((err) => {
			console.log('err: ', err);
		});
}

module.exports = Loader;