(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var wkapi_1 = require('./wkapi');
if (window) {
    window.WkApi = wkapi_1.WkApi;
}

},{"./wkapi":6}],2:[function(require,module,exports){
/// <reference path="typings/promise.d.ts" />
var jsonp_1 = require('./util/jsonp');
var Fetcher = (function () {
    function Fetcher(apiKey) {
        this.apiKey = apiKey;
        this.API_BASE = 'https://wanikani.com/api/v1.3/';
    }
    Fetcher.prototype.getData = function (type, limit) {
        return jsonp_1.jsonp(this.constructUrl(type, limit));
    };
    Fetcher.prototype.constructUrl = function (type, limit) {
        var url = this.API_BASE + type + '/';
        if (limit) {
            url += url + limit + '/';
        }
        return url;
    };
    return Fetcher;
})();
exports.Fetcher = Fetcher;

},{"./util/jsonp":3}],3:[function(require,module,exports){
/// <reference path="../typings/promise.d.ts" />
var objectConvert_1 = require('./objectConvert');
exports.jsonp = function (url) {
    if (!window.Promise) {
        throw 'Promise not available. Please apply a polyfill.';
    }
    return new Promise(function (resolve, reject) {
        var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        var script = createScript(url, callbackName);
        script.onerror = reject;
        document.body.appendChild(script);
        window[callbackName] = function (data) {
            resolve(objectConvert_1.convertCase(data));
            window[callbackName] = null;
            delete window[callbackName];
            document.body.removeChild(script);
        };
    });
    var createScript = function (url, callbackName) {
        var script = document.createElement('script');
        script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
        return script;
    };
};

},{"./objectConvert":4}],4:[function(require,module,exports){
exports.convertCase = function (obj) {
    if (!obj || typeof obj !== "object")
        return obj;
    if (obj instanceof Array) {
        return obj.map(function (value) { return exports.convertCase(value); });
    }
    var newObj = {};
    Object.keys(obj).forEach(function (prop) {
        var key = prop.replace(/\_(.)/gim, function (v) { return v[1].toUpperCase(); });
        newObj[key] = exports.convertCase(obj[prop]);
    });
    return newObj;
};

},{}],5:[function(require,module,exports){
/// <reference path="./typings/promise.d.ts" />
var fetcher_1 = require('./fetcher');
var WkCache = (function () {
    function WkCache(apiKey) {
        this.expiryTime = 3000;
        this.fetcher = new fetcher_1.Fetcher(apiKey);
    }
    WkCache.prototype.getUserInformation = function () {
        if (this.isValid(this.userInformation)) {
            return Promise.resolve(this.userInformation.userInformation);
        }
        return this.fetcher.getData('user_information');
    };
    WkCache.prototype.setExpiry = function (time) {
        this.expiryTime = time;
    };
    WkCache.prototype.isValid = function (cacheItem) {
        var now = this.getTime();
        var maxValidity = cacheItem.lastUpdated + this.expiryTime;
        return now > maxValidity;
    };
    WkCache.prototype.getTime = function () {
        return (new Date()).getTime() / 1000;
    };
    return WkCache;
})();
exports.WkCache = WkCache;

},{"./fetcher":2}],6:[function(require,module,exports){
var wkCache_1 = require('./wkCache');
var WkApi = (function () {
    function WkApi(apiKey) {
        this.apiKey = apiKey;
        if (apiKey.length !== 32 || !apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }
        this.cache = new wkCache_1.WkCache(apiKey);
        this.setExpiry(120);
    }
    WkApi.prototype.setExpiry = function (time) {
        this.cache.setExpiry(time);
    };
    WkApi.prototype.userInformation = function () {
        return this.cache.getUserInformation();
    };
    WkApi.prototype.studyQueue = function () {
        throw 'not yet implemented';
    };
    return WkApi;
})();
exports.WkApi = WkApi;

},{"./wkCache":5}]},{},[1]);
