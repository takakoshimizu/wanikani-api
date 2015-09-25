/// <reference path="./typings/promise.d.ts" />

import {
    IApiResponse, IApiInformation, IUserInformation,
    IStudyQueue, ILevelProgress, ISRSDistribution,
    IRecentUnlock, ICriticalItem, ILeveledItem,
    IRadical, IKanji, IVocab } from './typings/apiTypes';
import { IFetcher, Fetcher } from './fetcher';

interface ICache<T> {
    lastUpdated: number;
    data: T;
}

interface ILevelCache<T> {
    [key: number]: ICache<T>;
}

export interface IWkApi {
    getUserInformation(): Promise<IUserInformation>;
    getStudyQueue(): Promise<IStudyQueue>;
    getLevelProgression(): Promise<ILevelProgress>;
    getSrsDistribution(): Promise<ISRSDistribution>;
    getRecentUnlocks(count: number): Promise<IRecentUnlock[]>;
    getCriticalItems(rate: number): Promise<ICriticalItem[]>;
    getRadicals(levels: number | number[] | string): Promise<IRadical[]>;
    getKanji(levels: number | number[] | string): Promise<IKanji[]>;
    getVocabulary(levels: number | number[] | string): Promise<IVocab[]>;
    setExpiry(time: number): void;
    setLevelsPerRequest(levels: number): void;
}

export class WkApi implements IWkApi {
    private _fetcher: IFetcher;
    private _expiryTime: number = 3600; // seconds
    private _levelsPerRequest: number = 20;
    private _lastCriticalRate: number = 0;
    private _userInformation: ICache<IUserInformation> = <ICache<IUserInformation>> {};
    private _studyQueue: ICache<IStudyQueue> = <ICache<IStudyQueue>> {};
    private _levelProgress: ICache<ILevelProgress> = <ICache<ILevelProgress>> {};
    private _srsDistribution: ICache<ISRSDistribution> = <ICache<ISRSDistribution>> {};
    private _recentUnlocks: ICache<IRecentUnlock[]> = <ICache<IRecentUnlock[]>> {};
    private _criticalItems: ICache<ICriticalItem[]> = <ICache<ICriticalItem[]>> {};
    private _radicals: ILevelCache<IRadical[]> = <ILevelCache<IRadical[]>> {};
    private _kanji: ILevelCache<IKanji[]> = <ILevelCache<IKanji[]>> {};
    private _vocab: ILevelCache<IVocab[]> = <ILevelCache<IVocab[]>> {};

    private _storageKeys = ['_userInformation', '_studyQueue', '_levelProgress',
        '_srsDistribution', '_recentUnlocks', '_criticalItems',
        '_lastCriticalRate', '_radicals', '_kanji', '_vocab'];
    
    constructor(private _apiKey: string) {
        // validate apiKey format
        if (_apiKey.length !== 32 || !_apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }

        this._fetcher = new Fetcher(_apiKey);

        // load from local storage, if available
        if (window.localStorage) {
            this._loadLocalStorage();
        }
    }
    
    // Returns the cached user information in a promise if still valid.
    // Otherwise, returns a promise containing incoming information
    public getUserInformation(): Promise<IUserInformation> {
        if (this._isValid(this._userInformation)) {
            return Promise.resolve(this._userInformation.data);
        }
        return this._fetcher.getData<IApiResponse<IUserInformation>>('user-information')
            .then(value => this._setCacheItem(this._userInformation, value));
    }

    // Returns the cached study queue in a promise if still valid.
    // Otherwise returns a promise containing incoming information.
    public getStudyQueue(): Promise<IStudyQueue> {
        if (this._isValid(this._studyQueue)) {
            return Promise.resolve(this._studyQueue.data);
        }
        return this._fetcher.getData<IApiResponse<IStudyQueue>>('study-queue')
            .then(value => this._setCacheItem(this._studyQueue, value));
    }

    // Returns the cached level progression in a promise if still valid.
    // Otherwise returns a promise containing the incoming information.
    public getLevelProgression(): Promise<ILevelProgress> {
        if (this._isValid(this._levelProgress)) {
            return Promise.resolve(this._levelProgress.data);
        }
        return this._fetcher.getData<IApiResponse<ILevelProgress>>('level-progression')
            .then(value => this._setCacheItem(this._levelProgress, value));
    }

    // Returns the cached SRS Distribution in a promise if still valid.
    // Otherwise returns a promise containing the incoming information.
    public getSrsDistribution(): Promise<ISRSDistribution> {
        if (this._isValid(this._srsDistribution)) {
            return Promise.resolve(this._srsDistribution.data);
        }
        return this._fetcher.getData<IApiResponse<ISRSDistribution>>('srs-distribution')
            .then(value => this._setCacheItem(this._srsDistribution, value));
    }

    // Returns the recent unlocks list in a promise if still valid.
    // Otherwise returns a promise containing the incoming information
    // Takes a count between 1 and 100. Will Override the cache if the number
    // has changed
    public getRecentUnlocks(count: number = 10): Promise<IRecentUnlock[]> {
        let overrideCache = this._recentUnlocks.data
            && this._recentUnlocks.data.length != count;

        if (this._isValid(this._recentUnlocks) && !overrideCache) {
            return Promise.resolve(this._recentUnlocks.data);
        }
        return this._fetcher.getData<IApiResponse<IRecentUnlock[]>>('recent-unlocks', count)
            .then(value => this._setCacheItem(this._recentUnlocks, value));
    }

    // Returns the critical items list in a promise if still valid.
    // Otherwise returns a promise containing the incoming information.
    // Takes a correct-rate to use as the bar for entry. Anything lower
    // is included. Will override the cache if the correct-rate has changed.
    public getCriticalItems(rate: number = 75): Promise<ICriticalItem[]> {
        let overrideCache = this._lastCriticalRate != rate;

        if (this._isValid(this._criticalItems) && !overrideCache) {
            return Promise.resolve<ICriticalItem[]>(this._criticalItems.data);
        }

        this._lastCriticalRate = rate;

        return this._fetcher.getData<IApiResponse<ICriticalItem[]>>('critical-items', rate)
            .then(value => this._setCacheItem(this._criticalItems, value));
    }

    // Returns the radicals for the specified levels.
    // levels can be requested in multiple ways: a specific number,
    // a comma delimited string, an array of numbers, or a string range
    // eg: '1-20', inclusive, or both eg: '1-20,25'
    public getRadicals(levels: number | number[] | string): Promise<IRadical[]> {
        if (!this._radicals) this._radicals = {};

        let parsedLevels = this._parseLevelRequest(levels);
        let requiredLevels = this._findUncachedLevels(this._radicals, parsedLevels);

        if (requiredLevels.length == 0) {
            return Promise.resolve(this._pickCacheLevels<IRadical>(this._radicals, parsedLevels));
        }

        return this._fetcher.getData<IApiResponse<IRadical[]>>('radicals', requiredLevels.join(','))
            .then(value => {
                let sorted = this._sortToLevels(value.requestedInformation);

                this._cacheToLevels(this._radicals, sorted);
                this._setCacheItem(null, value);

                return this._pickCacheLevels(this._radicals, parsedLevels);
            });
    }

    // Returns the kanji for the specified levels
    // levels can be requested in multiple ways. See getRadicals
    // for more information.
    // Also splits large requests in half.
    public getKanji(levels: number | number[] | string): Promise<IKanji[]> {
        if (!this._kanji) this._kanji = {};

        let parsedLevels = this._parseLevelRequest(levels);
        let requiredLevels = this._findUncachedLevels(this._kanji, parsedLevels);

        if (requiredLevels.length == 0) {
            return Promise.resolve(this._pickCacheLevels(this._kanji, parsedLevels));
        }

        let kanjiPromises: Array<Promise<IApiResponse<IKanji[]>>> = [];
        while (requiredLevels.length > 0) {
            kanjiPromises.push(this._fetcher.getData<IApiResponse<IKanji[]>>('kanji',
                requiredLevels.splice(0, this._levelsPerRequest).join(',')));
        }

        return Promise.all(kanjiPromises)
            .then(values => {
                let sorted = this._sortToLevels(values.reduce((a, c) => a.concat(c.requestedInformation), []));
                this._cacheToLevels(this._kanji, sorted);
                this._setCacheItem(null, values[0]);

                return this._pickCacheLevels(this._kanji, parsedLevels);
            });
    }

    // Returns the vocabulary for the specified levels
    // levels can be requested in multiple ways. See getRadicals
    // for more information.
    // Also splits large requests in half
    public getVocabulary(levels: number | number[] | string): Promise<IVocab[]> {
        if (!this._vocab) this._vocab = {};

        let parsedLevels = this._parseLevelRequest(levels);
        let requiredLevels = this._findUncachedLevels(this._vocab, parsedLevels);

        if (requiredLevels.length == 0) {
            return Promise.resolve(this._pickCacheLevels<IVocab>(this._vocab, parsedLevels));
        }

        let vocabPromises: Array<Promise<IApiResponse<IVocab[]>>> = [];
        while (requiredLevels.length > 0) {
            vocabPromises.push(this._fetcher.getData<IApiResponse<IVocab[]>>('vocabulary',
                requiredLevels.splice(0, this._levelsPerRequest).join(',')));
        }

        return Promise.all(vocabPromises)
            .then(values => {
                let sorted = this._sortToLevels(values.reduce((a, c) => a.concat(c.requestedInformation), []));

                this._cacheToLevels(this._vocab, sorted);
                this._setCacheItem(null, values[0]);
                return this._pickCacheLevels(this._vocab, parsedLevels);
            });
    }

    // Sets the expiry time in seconds
    public setExpiry(time: number): void {
        this._expiryTime = time;
    }

    // Sets the maximum number of levels in a single request, applying only
    // to Kanji and Vocab item requests. Defaults to 20.
    public setLevelsPerRequest(levels: number): void {
        this._levelsPerRequest = levels;
    }

    // Parses the incoming request string to create an array of numbers
    private _parseLevelRequest(levels: number | number[] | string): number[]{
        if (typeof levels === 'number') {
            return [levels];
        }
        if (levels instanceof Array) {
            return levels;
        }
        let stringLevels: string[] = (<string> levels).split(',');
        return stringLevels.map(x => this._parseLevelString(x))
            .reduce((arr, v) => arr.concat(v))
            .filter((v, i, a) => a.indexOf(v) == i)
            .sort((a, b) => a - b);
    }

    // parses a list item to create an array of numbers, inclusive
    private _parseLevelString(level: string): number[] {
        if (level.indexOf('-') === -1) {
            return [Number(level)];
        }

        let endPoints: string[] = level.split('-');
        if (endPoints.length !== 2) {
            throw 'Invalid level request string';
        }

        let start = Number(endPoints[0]);
        let end = Number(endPoints[1]);
        // ensure endpoints in proper order
        if (start > end) {
            throw 'Invalid level request string';
        }

        return Array.apply(0, Array(end - start + 1))
            .map((_: any, i: number) => start + i);
    }

    // Finds any levels where the cache is no longer valid, or does not exist
    private _findUncachedLevels(cache: ILevelCache<any>, levels: number[]): number[] {
        return levels.filter(l => !cache[l] || (cache[l] && !this._isValid(cache[l])));
    }

    // Returns an input of an array of leveled items into their appropriate levels
    private _sortToLevels<T>(items: T[]): ILevelCache<T[]> {
        let finalObject: ILevelCache<T[]> = {};

        items.forEach(item => {
            if (!finalObject[(<any>item).level]) {
                finalObject[(<any>item).level] = { lastUpdated: null, data: <T[]>[]};
            }
            finalObject[(<any>item).level].data.push(item);
        });

        return finalObject;
    }

    // Caches items to a leveled cache
    private _cacheToLevels<T>(cache: ILevelCache<T[]>, toCache: ILevelCache<T[]>): ILevelCache<T[]> {
        Object.keys(toCache).forEach(k => {
            cache[<any>k] = toCache[<any>k];
            cache[<any>k].lastUpdated = this._getTime();
        });
        return cache;
    }

    // Returns an array of the requested LevelCache items for the supplied level array
    private _pickCacheLevels<T>(cache: ILevelCache<T[]>, levels: number[]): T[] {
        return levels.reduce((array: T[], level: number) => {
            if (cache[level] && cache[level].data) {
                return array.concat(cache[level].data);
            }
            return array;
        }, []);
    }

    // Sets the caching to the supplied cache object for the api Item
    private _setCacheItem<T>(cacheItem: ICache<T>, apiItem: IApiResponse<T>): T {
        let returnValue: any;
        if (apiItem.requestedInformation && cacheItem) {
            cacheItem.data = apiItem.requestedInformation;
            cacheItem.lastUpdated = this._getTime();
            returnValue = apiItem.requestedInformation;
        }

        // always update user information from every request
        if (apiItem.userInformation) {
            this._userInformation = {
                data: apiItem.userInformation,
                lastUpdated: this._getTime()
            };
            if (!returnValue) returnValue = apiItem.userInformation;
        }

        this._persistLocalStorage();
        return returnValue;
    }

    // Loads all persisted information from localStorage
    private _loadLocalStorage(): void {
        if (window.localStorage.getItem(this._apiKey)) {
            let parsedStorage: any = JSON.parse(window.localStorage.getItem(this._apiKey));
            for (let key of this._storageKeys) {
                (<any>this)[key] = parsedStorage[key];
            }
        }
    }

    // Persists all information to localStorage
    private _persistLocalStorage(): void {
        let toStore: any = {};
        for (let key of this._storageKeys) {
            if ((<any>this)[key]) {
                toStore[key] = (<any>this)[key];
            }
        }
        window.localStorage.setItem(this._apiKey, JSON.stringify(toStore));
    }

    // Clears all used localStorage
    private _clearLocalStorage(): void {
        window.localStorage[this._apiKey] = null;
    }
    
    // Returns if the supplied cache item is still valid
    // based on the current expiry time
    private _isValid(cacheItem: ICache<{}>): boolean {
        if (!cacheItem) return false;
        if (!cacheItem.lastUpdated) return false;
        let now = this._getTime();
        let maxValidity = cacheItem.lastUpdated + this._expiryTime;
        return maxValidity > now;
    }
    
    // Returns the current unix epoch time
    private _getTime(): number {
        return (new Date()).getTime() / 1000;
    }
}