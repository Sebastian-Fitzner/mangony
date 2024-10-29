import "mocha";
import { expect as expect$0 } from "chai";
import Mangony from "../index.js";
import optionsFactory from "./support/options-factory.js";

'use strict';

var expect = { expect: expect$0 }.expect;
var options = optionsFactory();
var app;

describe('mangony.data', function () {
    beforeEach(function () {
        app = new Mangony(options);
    });
    it('should set a new data object {a: b} on cache.pages with a specific id', function () {
        app.data.addToCache({
            type: 'pages',
            id: 'test',
            data: {
                a: 'b'
            }
        });
        expect(app.data.cache.pages.test).to.exist;
        expect(app.data.cache.pages.test).to.be.an('object');
        expect(app.data.cache.pages.test.a).to.equal('b');
    });
    it('should delete a data object from cache.pages with a specific id', function () {
        app.data.addToCache({
            type: 'pages',
            id: 'test',
            data: {
                a: 'b'
            }
        });
        app.data.deleteFromCache({
            type: 'pages',
            id: 'test'
        });
        expect(app.data.cache.pages.test).to.be.undefined;
    });
    it('should replace a data object from cache.pages with a specific id', function () {
        app.data.addToCache({
            type: 'pages',
            id: 'test',
            data: {
                a: 'b'
            }
        });
        app.data.replaceInCache({
            type: 'pages',
            id: 'test',
            data: {
                a: 'c'
            }
        });
        expect(app.data.cache.pages.test).to.exist;
        expect(app.data.cache.pages.test).to.be.an('object');
        expect(app.data.cache.pages.test.a).to.equal('c');
    });
});
