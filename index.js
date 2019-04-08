const serverPlugin = require('./lib/plugins/server');
const hbsTemplaterPlugin = require('./lib/plugins/hbs-templater');
const ftlTemplaterPlugin = require('./lib/plugins/ftl-templater');

module.exports = require('./lib/mangony');
module.exports.plugins = {
	serverPlugin,
	hbsTemplaterPlugin,
	ftlTemplaterPlugin
};
