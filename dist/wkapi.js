(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="typings/promise.d.ts" />
var jsonp_1 = require('./util/jsonp');
var Fetcher = (function () {
    function Fetcher(apiKey) {
        this.apiKey = apiKey;
        this.API_BASE = 'https://www.wanikani.com/api/v1.3/user/';
    }
    Fetcher.prototype.getData = function (type, limit) {
        return jsonp_1.jsonp(this.constructUrl(type, limit));
    };
    Fetcher.prototype.constructUrl = function (type, limit) {
        var url = this.API_BASE + this.apiKey + '/' + type + '/';
        if (limit) {
            url += url + limit + '/';
        }
        return url;
    };
    return Fetcher;
})();
exports.Fetcher = Fetcher;

},{"./util/jsonp":2}],2:[function(require,module,exports){
/// <reference path="../typings/promise.d.ts" />
var objectConvert_1 = require('./objectConvert');
exports.jsonp = function (url) {
    if (!window.Promise) {
        throw 'Promise not available. Please apply a polyfill.';
    }
    var createScript = function (url, callbackName) {
        var script = document.createElement('script');
        script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
        return script;
    };
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
};

},{"./objectConvert":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
/// <reference path="./typings/promise.d.ts" />
var fetcher_1 = require('./fetcher');
var WkCache = (function () {
    function WkCache(apiKey) {
        this.expiryTime = 3000;
        this.fetcher = new fetcher_1.Fetcher(apiKey);
    }
    WkCache.prototype.getUserInformation = function () {
        var _this = this;
        if (this.isValid(this.userInformation)) {
            return Promise.resolve(this.userInformation.userInformation);
        }
        return this.fetcher.getData('user-information')
            .then(function (value) {
            _this.userInformation = {
                userInformation: value,
                lastUpdated: _this.getTime()
            };
            return value;
        });
    };
    WkCache.prototype.setExpiry = function (time) {
        this.expiryTime = time;
    };
    WkCache.prototype.isValid = function (cacheItem) {
        if (!cacheItem)
            return false;
        var now = this.getTime();
        var maxValidity = cacheItem.lastUpdated + this.expiryTime;
        return maxValidity > now;
    };
    WkCache.prototype.getTime = function () {
        return (new Date()).getTime() / 1000;
    };
    return WkCache;
})();
exports.WkCache = WkCache;

},{"./fetcher":1}],5:[function(require,module,exports){
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

},{"./wkCache":4}],6:[function(require,module,exports){
(function (global){
var wkapi_1 = require('./wkapi');
global.WkApi = wkapi_1.WkApi;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./wkapi":5}]},{},[6]);
