import Mangony, { plugins } from '../index.js';
import express from 'express';

var TemplaterPlugin = plugins.ftlTemplaterPlugin;
var ServerPlugin = plugins.serverPlugin;
var mangony = new Mangony({
  cwd: 'test/fixtures/ftl',
  dest: 'test/expected/ftl',
  exportData: false,
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
        '**/*.ftl',
        '**/*.md',
      ],
    },
    partials: {
      dir: 'partials',
      files: [
        '**/*.ftl',
      ],
    },
    layouts: {
      dir: 'layouts',
      files: [
        '**/*.ftl',
      ],
    },
  },
  watch: true,
});
mangony.render()
  .then(() => mangony.use(TemplaterPlugin, {
    allow: {
      YFMContextData: true,
      YFMLayout: true,
    },
    compileStaticFiles: false,
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
