import serverPlugin from './lib/plugins/server.js';
import jsxTemplaterPlugin from './lib/plugins/jsx-templater.js';
import hbsTemplaterPlugin from './lib/plugins/hbs-templater.js';
import ftlTemplaterPlugin from './lib/plugins/ftl-templater.js';

export const plugins = {
  serverPlugin,
  jsxTemplaterPlugin,
  hbsTemplaterPlugin,
  ftlTemplaterPlugin,
};
export { default } from './lib/mangony.js';
