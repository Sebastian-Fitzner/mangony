/**
 * Contains event methods.
 *
 * @author Sebastian Fitzner
 */

var Events = require('events');
var EventEmitter = new Events();

function emitEvent(str, obj) {
    'use strict';
	EventEmitter.emit(str, obj);
}

function registerEvent(str, callback) {
    'use strict';
	EventEmitter.on(str, callback);
}

function registerEventOnce(str, callback) {
    'use strict';
	EventEmitter.once(str, callback);
}

exports.emitEvent = emitEvent;
exports.registerEvent = registerEvent;
exports.registerEventOnce = registerEventOnce;

// Global Events
exports.EVENTS = {
	cache: {
		updated: 'cache:updated'
	},
	data: {
		add: 'data:add',
		changed: 'data:changed',
		delete: 'data:delete'
	},
	layouts: {
		add: 'layouts:add',
		changed: 'layouts:changed',
		delete: 'layouts:delete'
	},
	pages: {
		add: 'pages:add',
		changed: 'pages:changed',
		delete: 'pages:delete'
	},
	partials: {
		add: 'partials:add',
		changed: 'partials:changed',
		delete: 'partials:delete'
	}
};