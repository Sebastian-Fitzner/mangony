import Mangony, { plugins } from '../index.js';
import TemplaterPlugin from '../lib/plugins/jsx-templater.js';
import express from 'express';
import React from 'react';
import ReactDomServer from 'react-dom/server';

const ServerPlugin = plugins.serverPlugin;
const mangony = new Mangony({
  cwd: 'test/fixtures/jsx',
  dest: 'test/expected/jsx',
  exportData: true,
  assets: './public',
  ext: '.html',
  flatten: false,
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
      dir: '',
      files: [
        'pages/**/*.jsx',
        'partials/**/*.jsx',
      ],
      ignore: [
        'pages/**/*.ignored.jsx',
        'partials/**/bricks/**/*',
        'partials/**/__tests__/**/*',
      ],
    },
    layouts: {
      dir: 'layouts',
      files: [
        '**/*.tsx',
      ],
    },
    partials: {
      dir: 'partials',
      files: [
        '**/*.tsx',
        '**/*.jsx',
      ],
    },
    commons: {
      dir: 'commons',
      files: ['**/*.js'],
    },
  },
  watch: true,
});
mangony.render()
  .then(() => mangony.use(TemplaterPlugin, {
    compileStaticFiles: true,
  }));
