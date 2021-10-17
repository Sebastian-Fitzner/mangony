/**
 * Represents a module which is used to read files and save a global data object.
 * It can be extended with plugins to support layouts, partials and pages.
 *
 * @module Mangony
 *
 * @author Sebastian Fitzner
 */

'use strict';

/**
 * Core Libs
 */
const path = require('path');

/**
 * Packages
 */
const deepMerge = require('deepmerge');
const chalk = require('chalk');
const Promise = require('bluebird');

/**
 * Internal Libs
 */

    // Modules
const Data = require('./modules/data');
const Watcher = require('./modules/watcher');

// Utilities
const helpers = require('./utils/helpers');
const loader = require('./utils/loader');
const events = require('./utils/events');

/**
 * Mangony Class
 */
class Mangony {
    constructor(opts) {
        this.options = {
            assets: '', // Assets directory
            collections: [],
            cwd: 'src', // Set the current directory
            dest: 'app',
            debug: false,
            exportData: false, // Export the complete data stack as JSON file
            evtNamespace: 'Mangony',
            generatePagesByJSON: null,
            types: { // All standard types should be defined in here
                data: { // Data type (JSON, HJSON)
                    createDeepIds: false, // Create custom IDs with sub directories included
                    pathDelimiter: false, // Provide a custom delimiter for path slashes
                    dir: '', // Directory of data files, will be used in watcher
                    files: [] // Array of data files - globbing supported
                },
                partials: { // Partials type (hbs files)
                    createDeepIds: false, // Create custom IDs with sub directories included
                    pathDelimiter: false, // Provide a custom delimiter for path slashes
                    dir: '', // Directory of files - will be used in watcher
                    files: [] // Array of files -  globbing supported
                },
                layouts: { // layouts type (hbs files)
                    createDeepIds: false, // Create custom IDs with sub directories included
                    pathDelimiter: false, // Provide a custom delimiter for path slashes
                    dir: '', // Directory of files - will be used in watcher
                    files: [] // Array of files -  globbing supported
                },
                pages: { // pages type (hbs files)
                    createDeepIds: true, // Create custom IDs with sub directories included
                    pathDelimiter: false, // Provide a custom delimiter for path slashes
                    dir: '', // Directory of files - will be used in watcher
                    files: [] // Array of files -  globbing supported
                }
            },
            watch: false // Enable an own watcher instance for all types

        };

        this.options = opts;

        this.initialize();
    }

    // GETTER AND SETTER

    /**
     * Return options
     */
    get options() {
        return this._options;
    }

    /**
     * Save options by merging default options with passed options
     */
    set options(options) {
        this._options = deepMerge(this._options || {}, options);
    }

    /**
     * Initialize Mangony instance and save references.
     */
    initialize() {
        this.cwd = helpers.endsWithSlash(this.options.cwd) ? this.options.cwd : this.options.cwd + '/';
        this.dest = helpers.endsWithSlash(this.options.dest) ? this.options.dest : this.options.dest + '/';
        this.evtNamespace = `${this.options.evtNamespace}:`;
        this.timeLogs = {
            getting: 'Got all files in',
            caching: 'Cached all files in',
            compiling: 'Compiled all files in',
            registering: 'Registered files in',
            finish: 'Mangony completed in'
        };
        this.data = new Data({
            collections: this.options.collections,
            types: this.options.types
        });
        this.watchers = this.options.watch ? {} : null;
        this.events = events.createEvents(this.options.types);
        this.Plugins = {};

        for (let type in this.options.types) {
            this[type + 'Files'] = null;
        }

        this.bindEvents();

        this.preRenderTime('init');
    }

    /**
     * Plugin system functionality.
     *
     * @public
     */
    use(plugin, ...args) {
        if (plugin.pluginName) {
            this.Plugins[plugin.pluginName] = plugin;
        }

        return plugin.initialize(this, ...args);
    }

    /**
     * Bind all events for the watcher.
     * This will only be used if this.options.watch === true.
     */
    bindEvents() {
        let updateData = ({file, evt}) => {
            loader.readFile(file)
                .then((data) => {
                    if (this.options.generatePagesByJSON === this.createFileId({
                        path: file,
                        type: 'data'
                    })) {
                        return this.createPagesFromJSON(data);
                    }

                    return this.createData({
                        path: file,
                        type: 'data',
                        data
                    });
                })
                .then((props) => {
                    const modifyCache = props => {
                        const {id, parsed, type} = props;
                        let dataObj = {
                            type,
                            id: id,
                            data: type === 'pages' ? props : parsed
                        };

                        this.preRenderTime('data_cache');

                        if (evt === 'add') {
                            this.data.addToCache(dataObj);
                        } else {
                            this.data.replaceInCache(dataObj);
                        }
                    };

                    if (Array.isArray(props)) {
                        this.data.deleteAllFromRepoByType('pages');

                        props.forEach(props => {
                            modifyCache(props);
                            events.emitEvent(this.evtNamespace + this.events.route.register, {
                                id: props.id,
                                route: props.serverFile
                            });

                            this.triggerReload(this.data.cache.pages[props.id]);

                        });
                    } else {
                        modifyCache(props);
                    }

                    return this.data.cache;
                })
                .then(() => {
                    return this.writeDataFile();
                })
                .then(() => {
                    this.postRenderTime('data_cache');
                    this.triggerReload();
                })
                .catch(function (err) {
                    console.log(chalk.red('\n Mangony :: (!) Error in updating data set: \n', err));
                });
        };

        let deleteFromCache = ({file, type}) => {
            const clearedType = type.replace(this.evtNamespace, '');
            let id = this.createFileId({
                path: file,
                type: clearedType
            });

            this.data.deleteFromCache({
                id: id,
                type: clearedType,
            });

            this.triggerReload();

            console.log(chalk.green('Mangony :: File ' + chalk.cyan(id) + ' deleted from cache!\n'));

        };

        // render single page
        let renderPage = obj => {
            loader.readFile(obj.file)
                .then((data) => {
                    return this.createData({
                        path: obj.file,
                        type: 'pages',
                        data: data
                    });
                })
                .then((data) => {
                    let dataObj = {
                        type: 'pages',
                        id: data.id,
                        data: data
                    };

                    if (obj.evt === 'add') {
                        this.data.addToCache(dataObj);
                    } else {
                        this.data.replaceInCache(dataObj);
                    }

                    this.preRenderTime('page_cache');

                    return this.data.cache.pages[data.id];
                })
                .then((fileData) => {
                    this.writeDataFile();

                    if (obj.evt === 'add') {
                        events.emitEvent(this.evtNamespace + this.events.route.register, {
                            id: fileData.id,
                            route: fileData.serverFile
                        });
                    }

                    return fileData;
                })
                .then((fileData) => {
                    this.postRenderTime('page_cache');
                    this.triggerReload(fileData);
                })
                .catch(function (err) {
                    console.log(chalk.red('\nMangony :: Error in rendering page: \n', err));

                    throw new Error(err);
                });
        };

        events.registerEvent(this.evtNamespace + this.events.pages.add, renderPage);
        events.registerEvent(this.evtNamespace + this.events.pages.changed, renderPage);
        events.registerEvent(this.evtNamespace + this.events.pages.delete, deleteFromCache);
        events.registerEvent(this.evtNamespace + this.events.data.add, updateData);
        events.registerEvent(this.evtNamespace + this.events.data.changed, updateData);
        events.registerEvent(this.evtNamespace + this.events.data.delete, deleteFromCache);
    }

    /**
     * Global Event system is triggering reload. Useful for server plugin.
     */
    triggerReload(fileData) {
        events.emitEvent(this.evtNamespace + this.events.cache.updated, {
            page: fileData
        });
    }

    /**
     * Export data set to a file.
     */
    writeDataFile() {
        if (this.options.exportData) {
            helpers
                .write(this.cwd + 'exported/exported-data.json', JSON.stringify(this.data.cache, null, 4))
                .catch((err) => {
                    console.warn(chalk.red('\n Mangony :: (!) The file could not be written: \n', err));
                });
        }
    }

    /**
     * Time starting of complete rendering
     */
    preRenderTime(namespace) {
        console.time(chalk.gray(`[${namespace.toUpperCase()}] `) + this.timeLogs.finish);
    }

    /**
     * Time ending of complete rendering
     */
    postRenderTime(namespace) {
        console.timeEnd(chalk.gray(`[${namespace.toUpperCase()}] `) + this.timeLogs.finish);
    }

    /**
     * Compile/Render the complete stack by
     * - getting all files (getAllFiles())
     * - caching all files (cacheAllFiles())
     * - registering helpers (templater)
     * - registering partials (templater)
     * - registering layouts (templater)
     * - render all pages (renderAllPages()) or
     * - register all routes (server).
     */
    render() {
        if (this.options.watch) this.createWatchers();

        return this.prepareData()
            .then(() => {
                return this.writeDataFile();
            })
            .then(() => {
                if (this.options.generatePagesByJSON) {
                    events.emitEvent(this.evtNamespace + this.events.data.add,
                        {
                            evt: 'add',
                            file: path.normalize(this.generatePagesByJSONPath)
                        });

                    return null;
                }
            })
            .catch((err) => {
                console.warn(chalk.red('\nMangony :: Files not prepared: ' + err));
            });
    }

    createPagesFromJSON(data) {
        const contextData = data.parsedData;
        const createPageObj = pageKey => {
            const pageData = contextData[pageKey];
            const newObj = {
                path: pageKey,
                type: 'pages',
                data: {
                    parsedData: {
                        content: '',
                        data: pageData.data
                    },
                    data: '',
                },
            };

            return this.createData(newObj);
        };

        return Object.keys(contextData).map(createPageObj);
    }

    /**
     * Data Handling
     */
    createData(obj) {
        let fileId = this.createFileId({
            path: obj.path,
            type: obj.type
        }).replace('./', '');
        let file = helpers.getFilename(obj.path);
        let typePath = this.cwd + this.options.types[obj.type].dir;
        let destPath = this.dest;
        let assetsPath = this.options.assets;
        let flatten = this.options.flatten;
        let contextData = obj.data.parsedData;
        let id = helpers.buildId({
            srcPath: obj.path,
            typePath: typePath,
            file
        }).replace('./', '');
        let getAssetsPath = this.options.flatten ?
            helpers.assetsPath(destPath, destPath + assetsPath) :
            helpers.assetsPath(destPath + helpers.buildPath({
                srcPath: obj.path,
                typePath: typePath
            }), destPath + assetsPath);

        if (this.data.cache[`${file}.settings`] && contextData.data && obj.type === 'pages') {
            contextData.data = Object.assign(contextData.data, this.data.cache[`${file}.settings`]);
        }

        if (this.options.generatePagesByJSON && this.options.generatePagesByJSON === fileId) {
            this.generatePagesByJSONPath = obj.path;
        }

        let ext = contextData.data && contextData.data.ext ? contextData.data.ext : this.options.ext;

        return {
            id: fileId,
            assets: getAssetsPath,
            ext: ext,
            srcExt: path.extname(obj.path),
            type: obj.type,
            basename: path.basename(obj.path),
            filename: file,
            dirname: path.dirname(obj.path),
            destDir: destPath,
            destSubDir: helpers.buildPath({
                srcPath: obj.path,
                typePath: typePath
            }),
            destFile: flatten ? file + ext : id + ext,
            serverFile: flatten ? file : id,
            raw: obj.data.data,
            parsed: contextData
        };
    }

    createFileId({path, type}) {
        let file = helpers.getFilename(path);

        return this.options.types[type].createDeepIds ? helpers.cleanId({
            srcPath: path,
            typePath: this.cwd + this.options.types[type].dir,
            pathDelimiter: this.options.types[type].pathDelimiter,
            file: file
        }) : file;
    }

    prepareData() {
        return this.getAllFiles()
            .then(() => {
                console.timeEnd(this.timeLogs.getting);
                console.time(this.timeLogs.caching);

                return this.cacheAllFiles();
            })
            .then((data) => {
                console.timeEnd(this.timeLogs.caching);

                return data;
            })
            .catch((err) => {
                console.warn(chalk.red('\nMangony :: Error in preparing files: \n' + err));
            });
    }

    /**
     * Get all files of types (pages, data, layouts, partials) by
     * normalizing paths (buildPaths()) and using
     * getFiles().
     */
    getAllFiles() {
        console.time(this.timeLogs.getting);

        const files = [];
        const getFilesOfType = (type) => {
            return this.buildPaths({
                dir: this.options.types[type].dir,
                files: this.options.types[type].files,
                ignore: this.options.types[type].ignore
            })
                .then((data) => {
                    return this.getFiles(data);
                })
                .then((data) => {
                    this[type + 'Files'] = data;

                    return data;
                });
        };

        for (let type in this.options.types) {
            if (this.options.types.hasOwnProperty(type)) {
                files.push(getFilesOfType(type));
            }
        }

        return Promise
            .all(files)
            .then(() => {
                return console.log(chalk.green('Mangony :: All files are saved!'));
            })
            .catch((err) => {
                console.log(chalk.red('\nMangony :: Error in caching all files: \n', err));
            })
    }

    /**
     * Get specific files by using loader(). Globbing is supported.
     *
     * @see ./modules/loader.js
     *
     * @param {String} filepath - Filepath to file
     *
     * @return Promise with loaded files
     */
    getFiles(filepath) {
        return loader.getFiles(filepath)
            .then((data) => {
                return data;
            })
            .catch(function (err) {
                console.log(`Mangony :: Error in getting files in ${filepath}:
					${err}
				`);
            });
    }

    /**
     * Cache all files (pages, data, partials, layouts) and return a new promise.
     *
     * @return Promise
     */
    cacheAllFiles() {
        const cache = [];
        const cacheType = (type) => {
            return this.cacheFiles({
                files: this[type + 'Files'],
                type: type
            }).then((data) => {
                return data;
            });
        };

        for (let type in this.options.types) {
            if (this.options.types.hasOwnProperty(type) && type !== 'pages') {
                cache.push(cacheType(type));
            }
        }

        return Promise
            .all(cache)
            .then(() => {
                return cacheType('pages');
            })
            .then((data) => {
                console.log(chalk.green('OK: All files are cached!'));
                return data;
            })
            .catch(err => console.error(chalk.red('Error in caching files!\n', err)));
    }

    /**
     * Cache multiple files.
     *
     * @param {Object} obj - Object
     * @param {Array} obj.files - Array of files (with glob patterns)
     * @param {Array} obj.type - Type of file
     */
    cacheFiles(obj) {
        return Promise.map(obj.files, (file) => {
            return this.cacheFile({
                path: file,
                type: obj.type
            });
        });
    }

    /**
     * Cache one single file.
     *
     * @param {Object} obj - Object
     * @param {Object} obj.path - Path of the file
     * @param {Object} obj.type - Type of the file
     *
     * @return Promise with data object of file
     */
    cacheFile(obj) {
        return loader.readFile(obj.path)
            .then((data) => {
                return this.createData({
                    path: obj.path,
                    type: obj.type,
                    data: data
                });
            })
            .then((data) => {
                this.data.addToCache({
                    type: obj.type,
                    id: data.id,
                    data: obj.type !== 'data' ? data : data.parsed
                });

                return this.data.cache;
            })
            .catch(function (err) {
                console.log(chalk.red(`Mangony :: Error in caching files in ${obj.path}: ${err}`));
            });
    }

    /**
     * Build paths from options and returns an array.
     *
     * @param {Object} obj - Object
     * @param {String} obj.dir - Current directory for paths
     * @param {Array} obj.files - File pattern in directory
     * @param {Array} obj.ignore - File pattern for ignoring files in directory
     * @param {Boolean} obj.plain - Dont return files normalized
     *
     * @return Promise<Array>
     */
    buildPaths(obj) {
        const buildPathsFor = (files) => files.map((file) => {
            const dir = obj.dir ? `${obj.dir}/` : '';
            const buildPaths = obj.plain ? this.cwd + dir + file : path.normalize(this.cwd + dir + file);

            return buildPaths;
        });
        const files = buildPathsFor(obj.files);
        const ignoredFiles = obj.ignore && obj.ignore.length > 0 ? buildPathsFor(obj.ignore) : [];

        return Promise.resolve(files.concat(ignoredFiles.map(ignoredFile => `!${ignoredFile}`)));
    }

    /**
     * Create all watcher instances
     */
    createWatchers() {
        console.info(chalk.cyan(chalk.bold('*** Started Mangony Watcher ***\n')));

        for (let type in this.options.types) {
            this.addWatcher(type).then((watcher) => {
                this.watchers[type] = watcher;
            });
        }
    }

    /**
     * Add a custom watcher to a directory.
     *
     * @param {String} type - The defined type
     */
    addWatcher(type) {
        return this.buildPaths({
            dir: this.options.types[type].dir,
            files: this.options.types[type].files,
            ignore: this.options.types[type].ignore,
            plain: true
        })
            .then((files) => {
                return new Watcher({
                    cwd: this.cwd,
                    exportData: this.options.exportData,
                    type: this.evtNamespace + type,
                    files: files
                });
            });
    }
}

module.exports = Mangony;
