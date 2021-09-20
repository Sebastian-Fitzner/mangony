const serverPlugin = require('./lib/plugins/server');
const jsxTemplaterPlugin = require('./lib/plugins/jsx-templater');
const hbsTemplaterPlugin = require('./lib/plugins/hbs-templater');
const ftlTemplaterPlugin = require('./lib/plugins/ftl-templater');

module.exports = require('./lib/mangony');
module.exports.plugins = {
	serverPlugin,
	jsxTemplaterPlugin,
	hbsTemplaterPlugin,
	ftlTemplaterPlugin
};
