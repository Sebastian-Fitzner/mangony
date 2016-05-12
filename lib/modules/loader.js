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
			console.log(chalk.red('\n(!) Error in getting files: \n', err));
		});
}

/**
 * Returns async function that loads specified file.
 * @param {String} srcPath - Path to file
 * @return {Object}
 */
function readFile(srcPath) {
	let ext = path.extname(srcPath);

	return fsx.readFileAsync(srcPath, 'utf8')
		.then((data) => {
			return parseData({
				type: ext,
				data: data
			});

		})
		.catch((err) => {
			console.log(chalk.red('\n(!) Error in reading files: \n', err));
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