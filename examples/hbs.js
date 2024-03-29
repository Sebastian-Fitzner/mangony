import Mangony, { plugins } from '../index.js';
import express from 'express';

var TemplaterPlugin = plugins.hbsTemplaterPlugin;
var ServerPlugin =plugins.serverPlugin;
var mangony = new Mangony({
  cwd: 'test/fixtures/hbs',
  dest: 'test/expected/hbs',
  generatePagesByFile: 'pages',
  exportData: true,
  ext: '.html',
  flatten: true,
  collections: [
    'sitemap', 'components',
  ],
  types: {
    data: {
      dir: 'data',
      files: [
        '**/*.json',
        '**/*.hjson',
      ],
    },
    pages: {
      dir: 'pages',
      files: [
        '**/*.hbs',
        '**/*.md',
      ],
    },
    partials: {
      dir: 'partials',
      files: [
        '**/*.hbs',
      ],
    },
    layouts: {
      dir: 'layouts',
      files: [
        '**/*.hbs',
      ],
    },
  },
  watch: true,
});
mangony.render()
  .then(() => mangony.use(TemplaterPlugin, {
    helpers: [
      'test/fixtures/helpers/*.js',
    ],
    compileStaticFiles: false,
    allow: {
      YFMContextData: true,
      YFMLayout: true,
    },
  }))
  .then(() => mangony.use(ServerPlugin, {
    express: express(),
    logSnippet: false,
    bsEnabled: true,
    injectScript: true,
    useExt: true,
    start: true,
    port: 3000,
    usePort: true,
    useAssetsDir: false,
    bsOptions: {},
  }));
