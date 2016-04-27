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
const marked = require('marked');
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
			console.log(chalk.red('(!) Error in getting files: \n', err));
		});
}

/**
 * Returns async function that loads specified file.
 * @param {Object} obj - Object
 * @param {String} obj.dataHandler - data handler instance
 * @param {String} obj.path - Path to file
 * @return {Object}
 */
function readFile(obj) {
	let file = Helpers.getFilename(obj.path);
	let ext = path.extname(obj.path);

	return fsx.readFileAsync(obj.path, 'utf8')
		.then((data) => {
			return parseData({
				type: ext,
				data: data
			});

		})
		.then((data) => {
			return {
				ext: ext,
				file: file,
				raw: data.data,
				parsed: data.parsedData
			};
		})
		.catch((err) => {
			console.log(chalk.red('(!) Error in reading files: \n', err));
		});
}

function parseData(obj) {
	return new Promise((resolve) => {
		switch (obj.type) {
			case '.json':
			{
				resolve({
					parsedData: JSON.parse(obj.data),
					data: obj.data
				});

				break;
			}
			case '.hjson':
			{
				resolve({
					parsedData: HJSON.parse(obj.data),
					data: obj.data
				});

				break;
			}

			default:
			{
				resolve({
					parsedData: matter(obj.data),
					data: obj.data
				});
			}
		}
	});
}

module.exports = Loader;