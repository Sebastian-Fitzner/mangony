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