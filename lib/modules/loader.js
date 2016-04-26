/**
 * Represents a loader which can be used to load files or read files.
 * @module loader
 *
 * @author Sebastian Fitzner
 */

'use strict';

const Promise = require("bluebird");
const glob = Promise.promisifyAll(require('multi-glob'));
const fsx = Promise.promisifyAll(require('fs-extra'));
const matter = require('gray-matter');
const path = require('path');
const HJSON = require('hjson');
const chalk = require('chalk');
const Helpers = require('../utils/helpers');

const Loader = {
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
			console.log(chalk.red('(!) ERROR in getting files: ', err));
		});
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
	let file = Helpers.getFilename(obj.path);
	let ext = path.extname(obj.path);

	return fsx.readFileAsync(obj.path, 'utf8')
		.then((data) => {
			let parsedData = matter(data);

			if (obj.type === 'data') {
				if (ext === '.json') {
					parsedData = JSON.parse(data);
				} else if (ext === '.hjson') {
					parsedData = HJSON.parse(data);
				} else {
					console.log(chalk.red('ERROR: Data type is currently not supported!'));
					return;
				}
			}

			return {
				file: file,
				raw: data,
				parsed: parsedData
			};
		})
		.catch((err) => {

			console.log(chalk.red('(!) ERROR in reading files: ', err));
		});
}

module.exports = Loader;