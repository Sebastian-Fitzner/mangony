<h1 align="center">
<img width="400px" src="https://github.com/Sebastian-Fitzner/mangony/blob/master/logo.svg" alt="Logo Mangony" />
</h1>

<p align="center">
    <a href="http://badge.fury.io/js/mangony"><img src="https://badge.fury.io/js/mangony.svg" alt="NPM version" /></a>
	<a href="https://travis-ci.org/Sebastian-Fitzner/mangony"><img src="https://travis-ci.org/Sebastian-Fitzner/mangony.svg" alt="Build Status" /></a>
	<a href="https://nodei.co/npm/mangony/"><img src="https://nodei.co/npm/mangony.png?mini=true" alt="NPM install" /></a>
	<a href="LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license" /></a>
</p>

<p align="center"><strong>Yet another static site generator - fast, simple, powerful and pluggable.</strong></p>

<p align="center">Mangony fulfills just one task: It takes files, saves them in cache, use templates and compiles them to an output directory.</p>

## Features

1. Mangony can be used anywhere as npm module. 
2. By using the provided development server ([express](https://github.com/expressjs/express)) every change is completed in no time, no matter how many pages you have in your project.
3. Only changed pages get compiled. 
4. Creation of deep ids is possible for all types. 
5. For every type (data, partials, layouts, pages) Mangony adds a watcher ([chokidar](https://github.com/paulmillr/chokidar)).
6. [HJSON](https://github.com/laktak/hjson) is available.
7. Supports different template rendering options like [Handlebars](https://github.com/wycats/handlebars.js/) or [React](https://github.com//).
9. [Markdown-it](https://github.com/markdown-it/markdown-it), [markdown-it-attrs](https://github.com/arve0/markdown-it-attrs) and [markdown-it-named-headers](https://github.com/leff/markdown-it-named-headers) are available.

## Installation

Install Mangony with 

``` bash
npm install mangony --save-dev
```

For the installation of the Grunt plugin, see [grunt-mangony](https://github.com/Sebastian-Fitzner/grunt-mangony).

## Usage

Just create a new instance of Mangony: 

``` js
const app = new Mangony();
```

Then render your mangony instance:

``` js
app.render();
```

To render files with a template engine you need to add a plugin. There are some engines provided to you, but you can easily create your own if you want to.

``` js 

```

When using the default options your files get compiled. But you can also integrate the development server. 

## Examples

**dev.js**

Let`s say we want to develop a new app with the dev server in place. 

``` js
const Mangony = require(`mangony`);
const jsx = require(`mangony`).plugins.jsxTemplaterPlugin;
const devServer = require(`mangony`).plugins.serverPlugin;
const app = new Mangony({
    cwd: `src`,
    dest: `dist/`,
    watch: true,
    types: {
        data: {
            dir: 'data',
            files: [
                '**/*.json',
                '**/*.hjson'
            ]
        },
        partials: {
            dir: 'partials',
            files: [
                '**/*.hbs'
            ]
        },
        pages: {
            dir: 'pages',
            files: [
                '**/*.tsx'
            ]
        },
        layouts: {
            dir: 'layouts',
            files: [
                '**/*.hbs'
            ]
        }
    }
});

app.render()
   .then(() => app.use(jsxTemplaterPlugin, {
       compileStaticFiles: false
   })
   .then(() => app.use(serverPlugin, {
        bsEnabled: true,
        injectScript: true,
        start: true,
        port: 3000,
        usePort: true,
        useAssetsDir: false,
   }));
```

When using the `devServer` options all routes get registered.

Now you can open your browser at `localhost:3000` and navigate to the page you want to change. 
The url is the path to your page without a file extension (i.e. `/index`). If you want to use the file extension as well, just enable it via options.

**prod.js**

Let`s say we want to build our static page. 

``` js
const Mangony = require(`mangony`);
const jsx = require(`mangony`).plugins.jsxTemplaterPlugin;
const app = new Mangony({
    cwd: `src`,
    dest: `dist/`
    types: {
        data: {
            dir: 'data',
            files: [
                '**/*.json',
                '**/*.hjson'
            ]
        },
        partials: {
            dir: 'partials',
            files: [
                '**/*.hbs'
            ]
        },
        pages: {
            dir: 'pages',
            files: [
                '**/*.hbs',
                '**/*.md'
            ]
        },
        layouts: {
            dir: 'layouts',
            files: [
                '**/*.hbs'
            ]
        }
    }
});

app.render()
    .then(() => app.use(jsxTemplaterPlugin, {
        compileStaticFiles: true,
    }));
```

Now you can find the complete rendered output in the destination folder.

## Options

### Generic Options

#### assets

- default: `"./"`

Path to your assets in your destination directory.

#### collections

- default: `[]`

Add your own collections which can be used in YAML front matter.

#### cwd

- default: `"src"`

The current working directory.

#### debug

- default: `false`

Print more comments in your terminal to debug a bit better ;).

#### dest

- default: `"app"`

Output directory.

### exportData

- default : `false`

Export the complete data stack as JSON file.

### ext

- default: `".html"`

Define the extension of your output files.
This can be overridden per file by using `YAML Front Matter` or `page.settings.json`.

### flatten

- default: `false`

Flatten your output directory.

### types (object)

There are 4 necessary types which needs to be defined:

- layouts
- pages
- partials
- data

Each type has the following options:

### types[type].createDeepIds

For every type you can create deep ids. The whole path to the file will be used. That makes it possible to have multiple identical named data, partial, layout and page files in different folders.

### types[type].dir

- default: `"[type]"`
- relative to `cwd`

You can change the type directory to any folder you like.

**Important: for every type directory Mangony creates a watcher if `options.watch` is `true`.**

### types[type].files

- default: `["**/*.[typeExtension]"]`

Pass an array of files to the files property. Globbing is possible.

### types[type].pathDelimiter

- default: `"/"`

By using deep ids the id is the path to your file. But using such ids in handlebars is not possible for your data files. That`s why you can define a path delimiter.

### watch

- default: `false`

Just enable the internal watching of file changes.

## Plugins 

### Dev Server Plugin (`plugins.ServerPlugin`)

The dev server is providing the best developer experience by triggering a reload when a file has changed and supporting the rendering of only requested files. 
That means, even when your project is growing in terms of pages and components it almost does not matter because only changed files get recompiled and rendered. 

#### Options

##### devServer.bs

- default: `null`

You can pass your own Browser-Sync instance.

##### devServer.bsEnabled

- default: `true`

You can disable browser-sync.

##### devServer.bsOptions

- default: `null`

You can pass your custom [Browser-Sync options](https://www.browsersync.io/docs/options) object.

##### devServer.express

- default: `null`

You can pass your own express instance.

##### devServer.injectScript

- default: true

Set to `false` if you want to disable the injection of the browser-sync script.

##### devServer.port

- default: `3000`

Change the port of the development server.

##### devServer.start

- default: `false`

Set to `true` if you want to use the provided development server.

##### devServer.useExt

- default: `true`

Set to `false` if you do not want to use extensions in your routes.

##### devServer.usePort

- default: `true`

Set to `false` if you have already a port provided to express.

##### devServer.useAssetsDir

- default: `true`

Set to `false` if you have already an asset directory provided to express.

### JSX Templater Plugin (`plugins.jsxTemplaterPlugin`)

With this plugin we can render React, Preact or similar JSX capable projects. Mangony is using a temporary directory to compile your files with ESBuild. 
That means `.tsx` and `.jsx` files are both supported out-of-the-box. 

#### Options

##### compileStaticFiles

- default: `true`

Enable/disable the compiling of your files.

### Handlebars Templater Plugin (`plugins.hbsTemplaterPlugin`)

#### allow.YFMLayout (`Boolean`)

- default: `false`

Add the possibility to reference layouts in YAML front matter. `{{{yield}}}` will be replaced in your referenced layout with the content of the page.

#### allow.YFMContextData (`Boolean`)

- default: `false`

Flag to add a specific data context for your page by referencing a data file id in YAML front matter.

#### compileStaticFiles

- default: `true`

Enable/disable the compiling of your files.

#### helpers

- default: `["helpers/*.js"]`
- relative to `cwd`

Register custom handlebars helpers by providing the path. Globbing is possible.

## Why Mangony?

**Static site generator and server?**

In general I love static site generators. Simply deploy the output and you`re done - great. 

But there is one major problem. When developing every change leads to the compiling of all pages. In large projects this is very time consuming.

So why not just combine a server for development purpose with a static site generator?

## Test

Just checkout the repository, install all dependencies with `npm install` and execute `npm test`. 

## Examples 

See `examples` folder for JSX, Handlebars or Freemarker Templates. 

## License 

see [LICENSE.md](https://github.com/Sebastian-Fitzner/mangony/blob/master/LICENSE.md).
