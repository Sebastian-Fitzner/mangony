import Promise from 'bluebird';
import fsExtra from 'fs-extra';
import { globby } from 'globby';
import matter from 'gray-matter';
import path from 'path';
import HJSON from 'hjson';
import chalk from 'chalk';

/**
 * Represents a loader which can be used to load files or read files.
 * @module loader
 *
 * @author Sebastian Fitzner
 */
'use strict';
const fsx = Promise.promisifyAll(fsExtra);
const Loader = {
  getFiles: getFiles,
  readFile: readFile,
};

/**
 * Get all files with multi-glob and Promises.
 *
 * @param {Array} paths - Paths in array
 */
function getFiles(paths) {
  return globby(paths)
    .then(function(files) {
      return files;
    })
    .catch((err) => {
      console.log(chalk.red('\n(!) Error in getting files in ' + chalk.bold(paths) + ': \n', err));
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
        data: data,
      });
    })
    .catch((err) => {
      console.log(chalk.red('\n(!) Error in reading file ' + chalk.bold(srcPath) + ': \n', err));
    });
}

function parseData(obj) {
  return new Promise((resolve) => {
    switch (obj.type) {
      case '.json': {
        resolve({
          parsedData: JSON.parse(obj.data),
          data: obj.data,
        });
        break;
      }
      case '.hjson': {
        resolve({
          parsedData: HJSON.parse(obj.data),
          data: obj.data,
        });
        break;
      }
      default: {
        const parsedData = matter(obj.data);
        parsedData.orig = null;
        resolve({
          parsedData: parsedData,
          data: obj.data,
        });
      }
    }
  });
}

export default Loader;
