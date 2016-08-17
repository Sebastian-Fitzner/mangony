<h1 align="center">
<img width="400px" src="http://www.veams.org/downloads/logo.svg" alt="Logo Mangony" />
</h1>

<p align="center">
    <a href="http://badge.fury.io/js/mangony"><img src="https://badge.fury.io/js/mangony.svg" alt="NPM version" /></a>
	<a href="https://travis-ci.org/Sebastian-Fitzner/mangony"><img src="https://travis-ci.org/Sebastian-Fitzner/mangony.svg" alt="Build Status" /></a>
	<a href="https://nodei.co/npm/mangony/"><img src="https://nodei.co/npm/mangony.png?mini=true" alt="NPM install" /></a>
	<a href="LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license" /></a>
</p>

<p align="center"><strong>Yet another static site generator - fast, simple and powerful.</strong></p>

<p align="center">Mangony fulfills just one task: It takes handlebars templates and compiles them to an output directory.</p>

## Features

_Think of Assemble ([grunt-assemble](https://github.com/assemble/grunt-assemble)) with a smooth mango juice - yummy._

1. Mangony can be used in Grunt, Gulp or standalone as npm module. 
2. By using the provided development server ([express](https://github.com/expressjs/express)) every change is completed in no time, no matter how many pages you have in your project.
3. Only changed pages get compiled. 
4. Creation of deep ids is possible for all types. 
5. For every type (data, partials, layouts, pages) Mangony adds a watcher ([chokidar](https://github.com/paulmillr/chokidar)).
6. [HJSON](https://github.com/laktak/hjson) is available.
7. [Handlebars](https://github.com/wycats/handlebars.js/) version 4.x is integrated.
8. Markdown pages with handlebars are supported.
9. [Markdown-it](https://github.com/markdown-it/markdown-it), [markdown-it-attrs](https://github.com/arve0/markdown-it-attrs) and [markdown-it-named-headers](https://github.com/leff/markdown-it-named-headers) are available.
10. Mangony provides many handlebars-helpers: 
 - [handlebars-helpers](https://github.com/assemble/handlebars-helpers/)
 - [mangony-hbs-helpers](https://github.com/Sebastian-Fitzner/mangony-hbs-helpers)
 - [mangony-hbs-helper-wrap-with](https://github.com/Sebastian-Fitzner/mangony-hbs-helper-wrap-with)

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

Then render your files or start your development server:

``` js
app.render();
```

When using the default options your files get compiled. 

## Examples

**dev.js**

Let`s say we want to develop a new app. 

``` js
const Mangony = require(`mangony`);
const app = new Mangony({
    allow: {
        YFMLayout: false,
        YFMContextData: false
    },
    compileStaticFiles: false
    cwd: `src`,
    dest: `dist/`,
    devServer: {
        start: true
    },
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
    },
    helpers: [
        'helpers/*.js'
    ]
});

app.render();
```

When using the `devServer` options all routes get registered.

Now you can open your browser at `localhost:3000` and navigate to the page you want to change. 
The url is the path to your page without a file extension (i.e. `/index`). 

**prod.js**

Let`s say we want to build our app. 

``` js
const Mangony = require(`mangony`);
const app = new Mangony({
    allow: {
        YFMLayout: false,
        YFMContextData: false
    },
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
    },
    helpers: [
        'helpers/*.js'
    ]
});

app.render();
```

Now you can find the complete rendered output in the destination folder.

## Options

### allow.YFMLayout (`Boolean`)

- default: `false`

Add the possibility to reference layouts in YAML front matter. `{{{yield}}}` will be replaced in your referenced layout with the content of the page.

### allow.YFMContextData (`Boolean`)

- default: `false`

Flag to add a specific data context for your page by referencing a data file id in YAML front matter. 

### assets

- default: `"./"`

Path to your assets in your destination directory. 

### collections

- default: `[]`

Add your own collections which can be used in YAML front matter.

### compileStaticFiles

- default: `true`

Enable/disable the compiling of your files.

### cwd

- default: `"src"`

The current working directory.

### dest

- default: `"app"`

Output directory.

### devServer.bs

- default: `null` 

You can pass your own Browser-Sync instance. 

### devServer.bsOptions

- default: `null` 

You can pass your custom [Browser-Sync options](https://www.browsersync.io/docs/options) object.

### devServer.express

- default: `null` 

You can pass your own express instance.

### devServer.injectScript

- default: true

Set to `false` if you want to disable the injection of the browser-sync script.

### devServer.port

- default: `3000` 

Change the port of the development server. 

### devServer.start

- default: `false` 

Set to `true` if you want to use the provided development server.


### exportData

- default : `false`
 
 Export the complete data stack as JSON file.

### ext

- default: `".html"` 

Define the extension of your output files. 

### flatten

- default: `false` 

Flatten your output directory. 

### helpers

- default: `["helpers/*.js"]`
- relative to `cwd`

Register custom handlebars helpers by providing the path. Globbing is possible.

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

## Why Mangony?

**Static site generator and server?**

In general I love static site generators. Simply deploy the output and you`re done - great. 

But there is one major problem. When developing every change leads to the compiling of all pages. In large projects this is very time consuming.

So why not just combine a server for development purpose with a static site generator? 

Special thanks goes to [Henri Podolski](https://github.com/HenriPodolski/) for the idea and discussion.

**Assemble?**

For 2 1/2 years I am working with Assemble. It is a great tool and I like it a lot. 

The new [Assemble](https://github.com/assemble/assemble) (a full stack site generator) seems to be pretty nice, but it doesn`t fit so well in my current stack. Grunt-assemble however has [a major bug](https://github.com/assemble/grunt-assemble/issues/22), so it is not usable in the latest release. 

**Last but not least**

I just wanted to develop a static site generator.

## Test

Just checkout the repository, install all dependencies with `npm install` and execute `npm test`. 

## Roadmap

### >=2.0.0

When necessary an eco system for plugins will be integrated. 

## License 

see [LICENSE.md](https://github.com/Sebastian-Fitzner/mangony/blob/master/LICENSE.md).