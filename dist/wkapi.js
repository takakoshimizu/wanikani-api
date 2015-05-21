(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="typings/promise.d.ts" />
var jsonp_1 = require('./util/jsonp');
var Fetcher = (function () {
    function Fetcher(_apiKey) {
        this._apiKey = _apiKey;
        this.API_BASE = 'https://www.wanikani.com/api/v1.3/user/';
    }
    Fetcher.prototype.getData = function (type, limit) {
        return jsonp_1.jsonp(this.constructUrl(type, limit));
    };
    Fetcher.prototype.constructUrl = function (type, limit) {
        var url = this.API_BASE + this._apiKey + '/' + type + '/';
        if (limit) {
            url += limit + '/';
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
        this._expiryTime = 3600;
        this._userInformation = {};
        this._studyQueue = {};
        this._levelProgress = {};
        this._srsDistribution = {};
        this._recentUnlocks = {};
        this.storageKeys = ['_userInformation', '_studyQueue', '_levelProgress',
            '_srsDistribution', '_recentUnlocks'];
        this._fetcher = new fetcher_1.Fetcher(apiKey);
        if (window.localStorage) {
            this.loadLocalStorage();
        }
    }
    WkCache.prototype.getUserInformation = function () {
        var _this = this;
        if (this.isValid(this._userInformation)) {
            return Promise.resolve(this._userInformation.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('user-information');
            data.then(function (value) {
                _this.setCacheItem(_this._userInformation, value);
                resolve(value.userInformation);
            }).catch(function () {
                reject();
            });
        });
    };
    WkCache.prototype.getStudyQueue = function () {
        var _this = this;
        if (this.isValid(this._studyQueue)) {
            return Promise.resolve(this._studyQueue.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('study-queue');
            data.then(function (value) {
                _this.setCacheItem(_this._studyQueue, value);
                resolve(value.requestedInformation);
            }).catch(function () {
                reject();
            });
        });
    };
    WkCache.prototype.getLevelProgression = function () {
        var _this = this;
        if (this.isValid(this._levelProgress)) {
            return Promise.resolve(this._levelProgress.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('level-progression');
            data.then(function (value) {
                _this.setCacheItem(_this._levelProgress, value);
                resolve(value.requestedInformation);
            }).catch(function () {
                reject();
            });
        });
    };
    WkCache.prototype.getSrsDistribution = function () {
        var _this = this;
        if (this.isValid(this._srsDistribution)) {
            return Promise.resolve(this._srsDistribution.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('srs-distribution');
            data.then(function (value) {
                _this.setCacheItem(_this._srsDistribution, value);
                resolve(value.requestedInformation);
            }).catch(function () {
                reject();
            });
        });
    };
    WkCache.prototype.getRecentUnlocks = function (count) {
        var _this = this;
        if (count === void 0) { count = 10; }
        var overrideCache = false;
        if (this._recentUnlocks.data) {
            overrideCache = this._recentUnlocks.data.length != count;
        }
        if (this.isValid(this._recentUnlocks) && !overrideCache) {
            return Promise.resolve(this._recentUnlocks.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('recent-unlocks', count);
            data.then(function (value) {
                _this.setCacheItem(_this._recentUnlocks, value);
                resolve(value.requestedInformation);
            }).catch(function () {
                reject();
            });
        });
    };
    WkCache.prototype.setExpiry = function (time) {
        this._expiryTime = time;
    };
    WkCache.prototype.setCacheItem = function (cacheItem, apiItem) {
        if (apiItem.requestedInformation) {
            cacheItem.data = apiItem.requestedInformation;
            cacheItem.lastUpdated = this.getTime();
        }
        if (apiItem.userInformation) {
            this._userInformation = {
                data: apiItem.userInformation,
                lastUpdated: this.getTime()
            };
        }
        this.persistLocalStorage();
    };
    WkCache.prototype.loadLocalStorage = function () {
        for (var _i = 0, _a = this.storageKeys; _i < _a.length; _i++) {
            var key = _a[_i];
            if (window.localStorage.getItem(key)) {
                this[key] = JSON.parse(window.localStorage.getItem(key));
            }
        }
    };
    WkCache.prototype.persistLocalStorage = function () {
        for (var _i = 0, _a = this.storageKeys; _i < _a.length; _i++) {
            var key = _a[_i];
            if (this[key]) {
                window.localStorage.setItem(key, JSON.stringify(this[key]));
            }
        }
    };
    WkCache.prototype.clearLocalStorage = function () {
        window.localStorage.clear();
    };
    WkCache.prototype.isValid = function (cacheItem) {
        if (!cacheItem)
            return false;
        if (!cacheItem.lastUpdated)
            return false;
        var now = this.getTime();
        var maxValidity = cacheItem.lastUpdated + this._expiryTime;
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
    function WkApi(_apiKey) {
        this._apiKey = _apiKey;
        if (_apiKey.length !== 32 || !_apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }
        this._cache = new wkCache_1.WkCache(_apiKey);
    }
    WkApi.prototype.setExpiry = function (time) {
        this._cache.setExpiry(time);
    };
    WkApi.prototype.getUserInformation = function () {
        return this._cache.getUserInformation();
    };
    WkApi.prototype.getStudyQueue = function () {
        return this._cache.getStudyQueue();
    };
    WkApi.prototype.getLevelProgression = function () {
        return this._cache.getLevelProgression();
    };
    WkApi.prototype.getSrsDistribution = function () {
        return this._cache.getSrsDistribution();
    };
    WkApi.prototype.getRecentUnlocks = function (count) {
        if (count === void 0) { count = 10; }
        return this._cache.getRecentUnlocks(count);
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
