/**
 * Represents a helper to embed snippets.
 *
 * @author Sebastian Fitzner
 */

var fs = require('fs');

(function() {
	module.exports.register = function(Handlebars, options) {

		/*
		 * Custom embeding helper.
		 *
		 * @return HTML
		 */
		Handlebars.registerHelper('embeding', function(path, type) {
			var file = fs.readFileSync(path, 'utf-8');
			var cl = type ? type : '';
			var content = '<pre><code class="' + cl + '">' + file.replace(/</gi, "&lt;").replace(/>/gi, "&gt;") + '</code></pre>';

			return new Handlebars.SafeString(content);
		});
	};
}).call(this);
