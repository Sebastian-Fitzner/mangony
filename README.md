# Mangony

**Yet another static site generator - fast, simple and powerful.**

_Think of Assemble (grunt-assemble) with a smooth mango juice - yummy._

## Features

1. **Mangony can be used in Grunt, Gulp or standalone as npm module.** 
2. **By using the provided development server every change is completed in no time, no matter how many pages you have in your project.**
3. **Only changed pages get compiled.** 
4. **Creation of deep ids for all types is possible.** 
5. **For every type (data, partials, layouts, pages) Mangony adds a watcher.**
6. **HJSON is available.**
7. **The newest handlebars version is integrated.**
8. **Markdown pages with handlebars are supported.**

## Installation

Install Mangony with 

``` bash
npm install mangony --save-dev
```

For the installation of the Grunt plugin, see grunt-mangony.

## Usage

Just create a new instance of Mangony: 

``` js
const app = new Mangony();
``` 

Then render your files or start your development server:

``` js
app.render();
```

By using default options your files get compiled. 

## Examples

**dev.js**

Let`s say we want to develop a new app. 

``` js
const Mangony = require(`mangony`);
const app = new Mangony({
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
                '/**/*.json',
                '/**/*.hjson'
            ]
        },
        partials: {
            dir: 'partials',
            files: [
                '/**/*.hbs'
            ]
        },
        pages: {
            dir: 'pages',
            files: [
                '/**/*.hbs',
                '/**/*.md'
            ]
        },
        layouts: {
            dir: 'layouts',
            files: [
                '/**/*.hbs'
            ]
        }
    },
    helpers: [
        'helpers/*.js'
    ]
});

app.render();
```

Now you can open your browser at `localhost:3000` and navigate to the page you want to change. 

**prod.js**

Let`s say we want to build our app. 

``` js
const Mangony = require(`mangony`);
const app = new Mangony({
    cwd: `src`,
    dest: `dist/`
    types: {
        data: {
            dir: 'data',
            files: [
                '/**/*.json',
                '/**/*.hjson'
            ]
        },
        partials: {
            dir: 'partials',
            files: [
                '/**/*.hbs'
            ]
        },
        pages: {
            dir: 'pages',
            files: [
                '/**/*.hbs',
                '/**/*.md'
            ]
        },
        layouts: {
            dir: 'layouts',
            files: [
                '/**/*.hbs'
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

### assets

- default: `"./"`

Path to your assets in your destination directory. 

### compileStaticFiles

- default: `true`

Enable/disable the compiling of your files.

### cwd

- default: `"src"`

The current working directory.

### dest

- default: `"app"`

Output directory.

### devServer.start

- default: `false` 

Set to `true` if you want to use the provided development server.

### devServer.express

- default: `null` 

You can pass your own express instance. 

### devServer.port

- default: `3000` 

Change the port of the development server. 

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

### types[type].dir

- default: `"[type]"`
- relative to `cwd`

You can change the type directory to any folder you like. 

!Important: for every type directory Mangony creates a watcher if `options.watch` is `true`.


### types[type].createDeepIds

For every type you can create deep ids. The whole path to the file will be used. That makes it possible to have multiple identical named data, partial, layout and page files in different folders.

### types[type].pathDelimiter

- default: `"/"`

By using deep ids the id is the path to your file. But using such ids in handlebars is not possible for your data files. That`s why you can define a path delimiter.

### types[type].files

- default: `["**/*.[typeExtension]"]`

Pass an array of files to the files property. Globbing is possible.

### watch

- default: `false`

Just enable the internal watching of file changes. 

## Why Mangony?

**Static site generator vs server**

In general I love static site generators. Simply deploy the output and you`re done - great. 

But there is one major problem. When developing every change leads to a compile of all pages. In large projects this is very time consuming.

That`s why I decided to combine a server for development purpose with a static site generator. 

**Assemble?**

For 2 1/2 years I am working with Assemble. It is a great tool and I like it a lot. 

The new assemble seems to be pretty nice, but it doesn`t fit so well in my current stack. Furthermore there is [a major bug](https://github.com/assemble/grunt-assemble/issues/22) in the latest grunt release. 

**Last but not least**

I just wanted to develop a static site generator.

## Test

Just execute `npm test`. 

## Roadmap

### <2.0.0
In the current release (<2.0.0) the following things are missing and will be integrated in the near future: 

- Collections
- YAML as data files

### >=2.0.0

When necessary an eco system for plugins will be integrated. 