/**
 * Contains event methods.
 *
 * @author Sebastian Fitzner
 */

const Events = require('events');
const EventEmitter = new Events();

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

// Global Events
const EVENTS = {
	cache: {
		updated: 'cache:updated'
	},
	route: {
		register: 'route:register'
	}
};

module.exports = {
	EVENTS: EVENTS,
	emitEvent,
	registerEvent,
	registerEventOnce,
	createEvents: function (types) {
		for (let type in types) {
			EVENTS[ type ] = {
				add: `${type}:add`,
				changed: `${type}:changed`,
				delete: `${type}:delete`
			}
		}

		return EVENTS;
	}
};