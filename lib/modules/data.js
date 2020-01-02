/**
 * Represents a data module to handle the caching of data.
 * @module data
 *
 * @author Sebastian Fitzner
 */

'use strict';

const Promise = require('bluebird');
const Helpers = require('../utils/helpers');

class Data {
    constructor({collections, types}) {
        this.collections = collections;
        this.types = types;
        this.cache = {
            servermode: false,
            '__repository': {},
            pages: {},
            collections: {}
        };

        this.initialize();
    }

    initialize() {
        for (let type in this.types) {
            this.cache.__repository[type] = [];

            if (type !== 'pages' && type !== 'data') {
                this.cache[`__${type}`] = {};
            }
        }

        if (this.collections.length) this.createCollections();
    }

    createCollections() {
        this.collections.forEach((item) => {
            this.cache.collections[item] = {};
        });
    }

    findCollectionByName(obj) {
        const ret = [];
        for (let key in obj) {

            if (this.cache.collections[key]) {
                ret.push(key);
            }
        }
        return ret;
    }

    /**
     * Add to cache.
     *
     * @param {Object} obj - Object which contains multiple elements
     * @param {String} obj.type - Type of element
     * @param {String} obj.id - File, which will be used as ID
     * @param {Object} obj.data - Data object
     */
    addToCache(obj) {
        let type = this.getCacheType(obj.type);

        if (obj.type === 'data') {
            this.cache[obj.id] = obj.data;
        } else {
            this.cache[type][obj.id] = obj.data;

            if (this.collections.length && obj.data.parsed) {
                let collections = this.findCollectionByName(obj.data.parsed.data);
                let id = {
                    files: []
                };

                Promise.map(collections, (name) => {
                    id = obj.data.parsed.data[name];

                    if (!this.cache.collections[name][id]) {
                        this.cache.collections[name][id] = {
                            name: id,
                            files: []
                        };
                    }

                    this.cache.collections[name][id].files.push(obj.id);
                });
            }
        }

        this.cache.__repository[obj.type].push(obj.id);
    }

    /**
     * Delete from cache.
     *
     * @param {Object} obj - Object which contains multiple elements
     * @param {String} obj.type - Type of element
     * @param {String} obj.id - File, which will be used as ID
     */
    deleteFromCache(obj) {
        let index = this.cache.__repository[obj.type].indexOf(obj.id);
        let type = this.getCacheType(obj.type);
        let data = null;


        if (obj.type === 'data') {
            data = this.cache[obj.id];
            delete this.cache[obj.id];
        } else {
            data = this.cache[type][obj.id];
            delete this.cache[type][obj.id];

            if (this.collections.length && data && data.parsed) {
                let collections = this.findCollectionByName(data.parsed.data);

                Promise.map(collections, (name) => {
                    let cIdx = this.cache.collections[name][data.parsed.data[name]].files.indexOf(obj.id);

                    this.cache.collections[name][data.parsed.data[name]].files.splice(cIdx, 1);
                });
            }
        }

        if (index >= 0)
            this.cache.__repository[obj.type].splice(index, 1);
    }

    deleteAllFromRepoByType(type) {
        this.cache.__repository[type] = [];
        this.cache[this.getCacheType(type)] = {};
    }


    /**
     * Replace id in cache by using deleteFromCache() and addToCache().
     *
     * @param {Object} obj - Object
     */
    replaceInCache(obj) {
        this.deleteFromCache(obj);
        this.addToCache(obj);
    }

    getCacheType(type) {
        if (type !== 'pages' && type !== 'data') {
            return '__' + type;
        } else {
            return type;
        }
    }
}

module.exports = Data;