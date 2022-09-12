import Events from 'events';

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
    updated: 'cache:updated',
  },
  route: {
    register: 'route:register',
  },
};
export const createEvents = function(types) {
  for (let type in types) {
    EVENTS[type] = {
      add: `${type}:add`,
      changed: `${type}:changed`,
      delete: `${type}:delete`,
    };
  }
  return EVENTS;
};
export { EVENTS };
export { emitEvent };
export { registerEvent };
export { registerEventOnce };
export default {
  EVENTS: EVENTS,
  emitEvent,
  registerEvent,
  registerEventOnce,
  createEvents,
};
