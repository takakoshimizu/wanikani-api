(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var wkapi_1 = require('./wkapi');
global.WkApi = wkapi_1.WkApi;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./wkapi":5}],2:[function(require,module,exports){
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
exports["default"] = Fetcher;

},{"./util/jsonp":3}],3:[function(require,module,exports){
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
var WkApi = (function () {
    function WkApi(_apiKey) {
        this._apiKey = _apiKey;
        this._maxLevel = 60;
        this._levelRange = '1-' + this._maxLevel;
        this._expiryTime = 3600;
        this._levelsPerRequest = 20;
        this._lastCriticalRate = 0;
        this._userInformation = {};
        this._studyQueue = {};
        this._levelProgress = {};
        this._srsDistribution = {};
        this._recentUnlocks = {};
        this._criticalItems = {};
        this._radicals = {};
        this._kanji = {};
        this._vocab = {};
        this._storageKeys = ['_userInformation', '_studyQueue', '_levelProgress',
            '_srsDistribution', '_recentUnlocks', '_criticalItems',
            '_lastCriticalRate', '_radicals', '_kanji', '_vocab'];
        if (_apiKey.length !== 32 || !_apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }
        this._fetcher = new fetcher_1["default"](_apiKey);
        if (window.localStorage) {
            this._loadLocalStorage();
        }
    }
    WkApi.prototype.getUserInformation = function () {
        var _this = this;
        if (this._isValid(this._userInformation)) {
            return Promise.resolve(this._userInformation.data);
        }
        return this._fetcher.getData('user-information')
            .then(function (value) { return _this._setCacheItem(_this._userInformation, value); });
    };
    WkApi.prototype.getStudyQueue = function () {
        var _this = this;
        if (this._isValid(this._studyQueue)) {
            return Promise.resolve(this._studyQueue.data);
        }
        return this._fetcher.getData('study-queue')
            .then(function (value) { return _this._setCacheItem(_this._studyQueue, value); });
    };
    WkApi.prototype.getLevelProgression = function () {
        var _this = this;
        if (this._isValid(this._levelProgress)) {
            return Promise.resolve(this._levelProgress.data);
        }
        return this._fetcher.getData('level-progression')
            .then(function (value) { return _this._setCacheItem(_this._levelProgress, value); });
    };
    WkApi.prototype.getSrsDistribution = function () {
        var _this = this;
        if (this._isValid(this._srsDistribution)) {
            return Promise.resolve(this._srsDistribution.data);
        }
        return this._fetcher.getData('srs-distribution')
            .then(function (value) { return _this._setCacheItem(_this._srsDistribution, value); });
    };
    WkApi.prototype.getRecentUnlocks = function (count) {
        var _this = this;
        if (count === void 0) { count = 10; }
        var overrideCache = this._recentUnlocks.data
            && this._recentUnlocks.data.length != count;
        if (this._isValid(this._recentUnlocks) && !overrideCache) {
            return Promise.resolve(this._recentUnlocks.data);
        }
        return this._fetcher.getData('recent-unlocks', count)
            .then(function (value) { return _this._setCacheItem(_this._recentUnlocks, value); });
    };
    WkApi.prototype.getCriticalItems = function (rate) {
        var _this = this;
        if (rate === void 0) { rate = 75; }
        var overrideCache = this._lastCriticalRate != rate;
        if (this._isValid(this._criticalItems) && !overrideCache) {
            return Promise.resolve(this._criticalItems.data);
        }
        this._lastCriticalRate = rate;
        return this._fetcher.getData('critical-items', rate)
            .then(function (value) { return _this._setCacheItem(_this._criticalItems, value); });
    };
    WkApi.prototype.getRadicals = function (levels) {
        var _this = this;
        if (levels === void 0) { levels = this._levelRange; }
        if (!this._radicals)
            this._radicals = {};
        return this._parseLevelRequest(levels).then(function (parsedLevels) {
            var requiredLevels = _this._findUncachedLevels(_this._radicals, parsedLevels);
            if (requiredLevels.length == 0) {
                return Promise.resolve(_this._pickCacheLevels(_this._radicals, parsedLevels));
            }
            return _this._fetcher.getData('radicals', requiredLevels.join(','))
                .then(function (value) {
                var sorted = _this._sortToLevels(value.requestedInformation);
                _this._cacheToLevels(_this._radicals, sorted);
                _this._setCacheItem(null, value);
                return _this._pickCacheLevels(_this._radicals, parsedLevels);
            });
        });
    };
    WkApi.prototype.getKanji = function (levels) {
        var _this = this;
        if (levels === void 0) { levels = this._levelRange; }
        if (!this._kanji)
            this._kanji = {};
        return this._parseLevelRequest(levels).then(function (parsedLevels) {
            var requiredLevels = _this._findUncachedLevels(_this._kanji, parsedLevels);
            if (requiredLevels.length == 0) {
                return Promise.resolve(_this._pickCacheLevels(_this._kanji, parsedLevels));
            }
            var kanjiPromises = [];
            while (requiredLevels.length > 0) {
                kanjiPromises.push(_this._fetcher.getData('kanji', requiredLevels.splice(0, _this._levelsPerRequest).join(',')));
            }
            return Promise.all(kanjiPromises)
                .then(function (values) {
                var sorted = _this._sortToLevels(values.reduce(function (a, c) { return a.concat(c.requestedInformation); }, []));
                _this._cacheToLevels(_this._kanji, sorted);
                _this._setCacheItem(null, values[0]);
                return _this._pickCacheLevels(_this._kanji, parsedLevels);
            });
        });
    };
    WkApi.prototype.getVocabulary = function (levels) {
        var _this = this;
        if (levels === void 0) { levels = this._levelRange; }
        if (!this._vocab)
            this._vocab = {};
        return this._parseLevelRequest(levels).then(function (parsedLevels) {
            var requiredLevels = _this._findUncachedLevels(_this._vocab, parsedLevels);
            if (requiredLevels.length == 0) {
                return Promise.resolve(_this._pickCacheLevels(_this._vocab, parsedLevels));
            }
            var vocabPromises = [];
            while (requiredLevels.length > 0) {
                vocabPromises.push(_this._fetcher.getData('vocabulary', requiredLevels.splice(0, _this._levelsPerRequest).join(',')));
            }
            return Promise.all(vocabPromises)
                .then(function (values) {
                var sorted = _this._sortToLevels(values.reduce(function (a, c) { return a.concat(c.requestedInformation); }, []));
                _this._cacheToLevels(_this._vocab, sorted);
                _this._setCacheItem(null, values[0]);
                return _this._pickCacheLevels(_this._vocab, parsedLevels);
            });
        });
    };
    WkApi.prototype.setExpiry = function (time) {
        this._expiryTime = time;
    };
    WkApi.prototype.setLevelsPerRequest = function (levels) {
        this._levelsPerRequest = levels;
    };
    WkApi.prototype._parseLevelRequest = function (levels) {
        var _this = this;
        return this.getUserInformation().then(function (ui) {
            if (typeof levels === 'number') {
                if (levels > ui.level)
                    throw new Error('Requested level out of range.');
                return [levels];
            }
            if (levels instanceof Array) {
                var newLevels = levels.filter(function (x) { return x > 0 && x < ui.level; });
                if (newLevels.length == 0)
                    throw new Error('Requested levels out of range.');
                return levels;
            }
            var stringLevels = levels.split(',');
            var parsedLevels = stringLevels.map(function (x) { return _this._parseLevelString(x); })
                .reduce(function (arr, v) { return arr.concat(v); })
                .filter(function (v, i, a) { return a.indexOf(v) == i; })
                .filter(function (x) { return x > 0 && x <= ui.level; })
                .sort(function (a, b) { return a - b; });
            if (parsedLevels.length == 0)
                throw new Error('Requested levels out of range.');
            return parsedLevels;
        });
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
        return Array.apply(0, Array(end - start + 1))
            .map(function (_, i) { return start + i; });
    };
    WkApi.prototype._findUncachedLevels = function (cache, levels) {
        var _this = this;
        return levels.filter(function (l) { return !cache[l] || (cache[l] && !_this._isValid(cache[l])); });
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
    WkApi.prototype._cacheToLevels = function (cache, toCache) {
        var _this = this;
        Object.keys(toCache).forEach(function (k) {
            cache[k] = toCache[k];
            cache[k].lastUpdated = _this._getTime();
        });
        return cache;
    };
    WkApi.prototype._pickCacheLevels = function (cache, levels) {
        return levels.reduce(function (array, level) {
            if (cache[level] && cache[level].data) {
                return array.concat(cache[level].data);
            }
            return array;
        }, []);
    };
    WkApi.prototype._setCacheItem = function (cacheItem, apiItem) {
        var returnValue;
        if (apiItem.requestedInformation && cacheItem) {
            cacheItem.data = apiItem.requestedInformation;
            cacheItem.lastUpdated = this._getTime();
            returnValue = apiItem.requestedInformation;
        }
        if (apiItem.userInformation) {
            this._userInformation = {
                data: apiItem.userInformation,
                lastUpdated: this._getTime()
            };
            if (!returnValue)
                returnValue = apiItem.userInformation;
        }
        this._persistLocalStorage();
        return returnValue;
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
        if (!window.localStorage)
            return;
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

},{"./fetcher":2}]},{},[1]);
