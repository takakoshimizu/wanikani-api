(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="typings/promise.d.ts" />
var jsonp_1 = require('./util/jsonp');
var Fetcher = (function () {
    function Fetcher(_apiKey) {
        this._apiKey = _apiKey;
        this.API_BASE = 'https://www.wanikani.com/api/v1.3/user/';
    }
    Fetcher.prototype.getData = function (type, args) {
        return jsonp_1.jsonp(this.constructUrl(type, args));
    };
    Fetcher.prototype.constructUrl = function (type, args) {
        var url = this.API_BASE + this._apiKey + '/' + type + '/';
        if (args) {
            url += args + '/';
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
            if (data.error) {
                reject(data.error);
            }
            else {
                resolve(objectConvert_1.convertCase(data));
            }
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
var WkApi = (function () {
    function WkApi(_apiKey) {
        this._apiKey = _apiKey;
        this._expiryTime = 3600;
        this._lastCriticalRate = 0;
        this._userInformation = {};
        this._studyQueue = {};
        this._levelProgress = {};
        this._srsDistribution = {};
        this._recentUnlocks = {};
        this._criticalItems = {};
        this._radicals = {};
        this._storageKeys = ['_userInformation', '_studyQueue', '_levelProgress',
            '_srsDistribution', '_recentUnlocks', '_criticalItems',
            '_lastCriticalRate', '_radicals'];
        if (_apiKey.length !== 32 || !_apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }
        this._fetcher = new fetcher_1.Fetcher(_apiKey);
        if (window.localStorage) {
            this._loadLocalStorage();
        }
    }
    WkApi.prototype.getUserInformation = function () {
        var _this = this;
        if (this._isValid(this._userInformation)) {
            return Promise.resolve(this._userInformation.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('user-information');
            data.then(function (value) {
                _this._setCacheItem(_this._userInformation, value);
                resolve(value.userInformation);
            }).catch(reject);
        });
    };
    WkApi.prototype.getStudyQueue = function () {
        var _this = this;
        if (this._isValid(this._studyQueue)) {
            return Promise.resolve(this._studyQueue.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('study-queue');
            data.then(function (value) {
                _this._setCacheItem(_this._studyQueue, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
    };
    WkApi.prototype.getLevelProgression = function () {
        var _this = this;
        if (this._isValid(this._levelProgress)) {
            return Promise.resolve(this._levelProgress.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('level-progression');
            data.then(function (value) {
                _this._setCacheItem(_this._levelProgress, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
    };
    WkApi.prototype.getSrsDistribution = function () {
        var _this = this;
        if (this._isValid(this._srsDistribution)) {
            return Promise.resolve(this._srsDistribution.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('srs-distribution');
            data.then(function (value) {
                _this._setCacheItem(_this._srsDistribution, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
    };
    WkApi.prototype.getRecentUnlocks = function (count) {
        var _this = this;
        if (count === void 0) { count = 10; }
        var overrideCache = false;
        if (this._recentUnlocks.data) {
            overrideCache = this._recentUnlocks.data.length != count;
        }
        if (this._isValid(this._recentUnlocks) && !overrideCache) {
            return Promise.resolve(this._recentUnlocks.data);
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('recent-unlocks', count);
            data.then(function (value) {
                _this._setCacheItem(_this._recentUnlocks, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
    };
    WkApi.prototype.getCriticalItems = function (rate) {
        var _this = this;
        if (rate === void 0) { rate = 75; }
        var overrideCache = this._lastCriticalRate != rate;
        if (this._isValid(this._criticalItems) && !overrideCache) {
            return Promise.resolve(this._criticalItems.data);
        }
        this._lastCriticalRate = rate;
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('critical-items', rate);
            data.then(function (value) {
                _this._setCacheItem(_this._criticalItems, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
    };
    WkApi.prototype.getRadicals = function (levels) {
        var _this = this;
        if (!this._radicals)
            this._radicals = {};
        var parsedLevels = this._parseLevelRequest(levels);
        var requiredLevels = this._findUncachedLevels(this._radicals, parsedLevels);
        var completeCall = function () {
            return parsedLevels.reduce(function (array, level) {
                if (_this._radicals[level]) {
                    return array.concat(_this._radicals[level].data);
                }
                return array;
            }, []);
        };
        if (requiredLevels.length == 0) {
            return Promise.resolve(completeCall());
        }
        return new Promise(function (resolve, reject) {
            var data = _this._fetcher.getData('radicals', requiredLevels.join(','));
            data.then(function (value) {
                var sorted = _this._sortToLevels(value.requestedInformation);
                for (var prop in sorted) {
                    _this._radicals[prop] = sorted[prop];
                    _this._radicals[prop].lastUpdated = _this._getTime();
                }
                _this._setCacheItem(_this._userInformation, value);
                resolve(completeCall());
            });
        });
    };
    WkApi.prototype.setExpiry = function (time) {
        this._expiryTime = time;
    };
    WkApi.prototype._parseLevelRequest = function (levels) {
        var _this = this;
        if (typeof levels === 'number') {
            return [levels];
        }
        if (levels instanceof Array) {
            return levels;
        }
        var stringLevels = levels.split(',');
        return stringLevels.reduce(function (array, value) {
            return array.concat(_this._parseLevelString(value)).reduce(function (array, value) {
                if (array.indexOf(value) < 0)
                    array.push(value);
                return array;
            }, []);
        }, []).sort(function (a, b) { return a - b; });
    };
    WkApi.prototype._parseLevelString = function (level) {
        if (level.indexOf('-') === -1) {
            return [Number(level)];
        }
        var endPoints = level.split('-');
        if (endPoints.length !== 2) {
            throw 'Invalid level request string';
        }
        var start = Number(endPoints[0]);
        var end = Number(endPoints[1]);
        if (start > end) {
            throw 'Invalid level request string';
        }
        var levelArray = [];
        while (start <= end) {
            levelArray.push(start++);
        }
        return levelArray;
    };
    WkApi.prototype._findUncachedLevels = function (cache, levels) {
        var uncached = [];
        if (!cache)
            cache = {};
        for (var _i = 0; _i < levels.length; _i++) {
            var level = levels[_i];
            if (!cache[level] || (cache[level] && !this._isValid(cache[level]))) {
                uncached.push(level);
            }
        }
        return uncached;
    };
    WkApi.prototype._sortToLevels = function (items) {
        var finalObject = {};
        items.forEach(function (item) {
            if (!finalObject[item.level]) {
                finalObject[item.level] = { lastUpdated: null, data: [] };
            }
            finalObject[item.level].data.push(item);
        });
        return finalObject;
    };
    WkApi.prototype._setCacheItem = function (cacheItem, apiItem) {
        if (apiItem.requestedInformation) {
            cacheItem.data = apiItem.requestedInformation;
            cacheItem.lastUpdated = this._getTime();
        }
        if (apiItem.userInformation) {
            this._userInformation = {
                data: apiItem.userInformation,
                lastUpdated: this._getTime()
            };
        }
        this._persistLocalStorage();
    };
    WkApi.prototype._loadLocalStorage = function () {
        if (window.localStorage.getItem(this._apiKey)) {
            var parsedStorage = JSON.parse(window.localStorage.getItem(this._apiKey));
            for (var _i = 0, _a = this._storageKeys; _i < _a.length; _i++) {
                var key = _a[_i];
                this[key] = parsedStorage[key];
            }
        }
    };
    WkApi.prototype._persistLocalStorage = function () {
        var toStore = {};
        for (var _i = 0, _a = this._storageKeys; _i < _a.length; _i++) {
            var key = _a[_i];
            if (this[key]) {
                toStore[key] = this[key];
            }
        }
        window.localStorage.setItem(this._apiKey, JSON.stringify(toStore));
    };
    WkApi.prototype._clearLocalStorage = function () {
        window.localStorage[this._apiKey] = null;
    };
    WkApi.prototype._isValid = function (cacheItem) {
        if (!cacheItem)
            return false;
        if (!cacheItem.lastUpdated)
            return false;
        var now = this._getTime();
        var maxValidity = cacheItem.lastUpdated + this._expiryTime;
        return maxValidity > now;
    };
    WkApi.prototype._getTime = function () {
        return (new Date()).getTime() / 1000;
    };
    return WkApi;
})();
exports.WkApi = WkApi;

},{"./fetcher":1}],5:[function(require,module,exports){
(function (global){
var wkapi_1 = require('./wkapi');
global.WkApi = wkapi_1.WkApi;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./wkapi":4}]},{},[5]);
