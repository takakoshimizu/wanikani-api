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
    setExpiry(time: number): void;
    setLevelsPerRequest(levels: number): void;
}

export class WkApi implements IWkApi {
    private _fetcher: IFetcher;
    private _expiryTime: number = 3600; // seconds
    private _levelsPerRequest: number = 25;
    private _lastCriticalRate: number = 0;
    private _userInformation: ICache<IUserInformation> = <ICache<IUserInformation>> {};
    private _studyQueue: ICache<IStudyQueue> = <ICache<IStudyQueue>> {};
    private _levelProgress: ICache<ILevelProgress> = <ICache<ILevelProgress>> {};
    private _srsDistribution: ICache<ISRSDistribution> = <ICache<ISRSDistribution>> {};
    private _recentUnlocks: ICache<IRecentUnlock[]> = <ICache<IRecentUnlock[]>> {};
    private _criticalItems: ICache<ICriticalItem[]> = <ICache<ICriticalItem[]>> {};
    private _radicals: ILevelCache<IRadical[]> = <ILevelCache<IRadical[]>> {};
    private _kanji: ILevelCache<IKanji[]> = <ILevelCache<IKanji[]>> {};

    private _storageKeys = ['_userInformation', '_studyQueue', '_levelProgress',
        '_srsDistribution', '_recentUnlocks', '_criticalItems',
        '_lastCriticalRate', '_radicals', '_kanji'];
    
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
            return Promise.resolve<IUserInformation>(this._userInformation.data);
        }
        return new Promise<IUserInformation>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<IUserInformation>>('user-information');
            data.then((value: IApiResponse<IUserInformation>) => {
                this._setCacheItem(this._userInformation, value);
                resolve(value.userInformation);
            }).catch(reject);
        });
    }

    // Returns the cached study queue in a promise if still valid.
    // Otherwise returns a promise containing incoming information.
    public getStudyQueue(): Promise<IStudyQueue> {
        if (this._isValid(this._studyQueue)) {
            return Promise.resolve<IStudyQueue>(this._studyQueue.data);
        }
        return new Promise<IStudyQueue>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<IStudyQueue>>('study-queue');
            data.then((value: IApiResponse<IStudyQueue>) => {
                this._setCacheItem(this._studyQueue, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
    }

    // Returns the cached level progression in a promise if still valid.
    // Otherwise returns a promise containing the incoming information.
    public getLevelProgression(): Promise<ILevelProgress> {
        if (this._isValid(this._levelProgress)) {
            return Promise.resolve<ILevelProgress>(this._levelProgress.data);
        }
        return new Promise<ILevelProgress>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<ILevelProgress>>('level-progression');
            data.then((value: IApiResponse<ILevelProgress>) => {
                this._setCacheItem(this._levelProgress, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
    }

    // Returns the cached SRS Distribution in a promise if still valid.
    // Otherwise returns a promise containing the incoming information.
    public getSrsDistribution(): Promise<ISRSDistribution> {
        if (this._isValid(this._srsDistribution)) {
            return Promise.resolve<ISRSDistribution>(this._srsDistribution.data);
        }
        return new Promise<ISRSDistribution>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<ISRSDistribution>>('srs-distribution');
            data.then((value: IApiResponse<ISRSDistribution>) => {
                this._setCacheItem(this._srsDistribution, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
    }

    // Returns the recent unlocks list in a promise if still valid.
    // Otherwise returns a promise containing the incoming information
    // Takes a count between 1 and 100. Will Override the cache if the number
    // has changed
    public getRecentUnlocks(count: number = 10): Promise<IRecentUnlock[]> {
        let overrideCache = false;
        if (this._recentUnlocks.data) {
            overrideCache = this._recentUnlocks.data.length != count;
        }

        if (this._isValid(this._recentUnlocks) && !overrideCache) {
            return Promise.resolve<IRecentUnlock[]>(this._recentUnlocks.data);
        }
        return new Promise<IRecentUnlock[]>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<IRecentUnlock[]>>('recent-unlocks', count);
            data.then((value: IApiResponse<IRecentUnlock[]>) => {
                this._setCacheItem(this._recentUnlocks, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
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

        return new Promise<ICriticalItem[]>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<ICriticalItem[]>>('critical-items', rate);
            data.then((value: IApiResponse<ICriticalItem[]>) => {
                this._setCacheItem(this._criticalItems, value);
                resolve(value.requestedInformation);
            }).catch(reject);
        });
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

        return new Promise<IRadical[]>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<IRadical[]>>('radicals', requiredLevels.join(','));
            data.then((value: IApiResponse<IRadical[]>) => {
                let sorted = this._sortToLevels(value.requestedInformation);

                this._cacheToLevels<IRadical>(this._radicals, sorted);
                this._setCacheItem(this._userInformation, value);

                resolve(this._pickCacheLevels<IRadical>(this._radicals, parsedLevels));
            });
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
            return Promise.resolve(this._pickCacheLevels<IKanji>(this._kanji, parsedLevels));
        }

        return new Promise<IKanji[]>((resolve, reject) => {
            let kanjiPromises: Array<Promise<IApiResponse<IKanji[]>>> = [];
            while (requiredLevels.length > 0) {
                kanjiPromises.push(this._fetcher.getData<IApiResponse<IKanji[]>>('kanji', requiredLevels.splice(0, 25).join(',')));
            }

            return Promise.all(kanjiPromises).then((results: Array<IApiResponse<IKanji[]>>) => {
                let mergedArray: IKanji[] = [];
                for (let result of results) {
                    mergedArray = mergedArray.concat(result.requestedInformation);
                }
                let sorted = this._sortToLevels(mergedArray);

                this._cacheToLevels<IKanji>(this._kanji, sorted);
                this._setCacheItem(this._userInformation, results[0]);

                resolve(this._pickCacheLevels<IKanji>(this._kanji, parsedLevels));
            });
        });
    }
    
    // Sets the expiry time in seconds
    public setExpiry(time: number): void {
        this._expiryTime = time;
    }

    // Sets the maximum number of levels in a single request, applying only
    // to Kanji and Vocab item requests. Defaults to 25.
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
        return stringLevels.reduce((array: number[], value: string): number[] => {
            return array.concat(this._parseLevelString(value)).reduce((array: number[], value: number) => {
                if (array.indexOf(value) < 0) array.push(value);
                return array;
            }, []);
        }, []).sort((a: number, b: number) => a - b);
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

        let levelArray: number[] = [];
        while (start <= end) {
            levelArray.push(start++);
        }
        return levelArray;
    }

    // Finds any levels where the cache is no longer valid, or does not exist
    private _findUncachedLevels(cache: ILevelCache<any>, levels: number[]): number[]{
        let uncached: number[] = [];
        if (!cache) cache = {};
        for (let level of levels) {
            if (!cache[level] || (cache[level] && !this._isValid(cache[level]))) {
                uncached.push(level);
            }
        }
        return uncached;
    }

    // Returns an input of an array of leveled items into their appropriate levels
    private _sortToLevels<T>(items: T[]): ILevelCache<T[]> {
        let finalObject: ILevelCache<T[]> = {};

        items.forEach((item: T) => {
            if (!finalObject[(<any>item).level]) {
                finalObject[(<any>item).level] = { lastUpdated: null, data: <T[]>[]};
            }
            finalObject[(<any>item).level].data.push(item);
        });

        return finalObject;
    }

    private _cacheToLevels<T>(cache: ILevelCache<T[]>, toCache: ILevelCache<T[]>): ILevelCache<T[]> {
        for (let prop in toCache) {
            cache[prop] = toCache[prop];
            cache[prop].lastUpdated = this._getTime();
        }
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
    private _setCacheItem(cacheItem: ICache<{}>, apiItem: IApiResponse<{}>): void {
        if (apiItem.requestedInformation) {
            cacheItem.data = apiItem.requestedInformation;
            cacheItem.lastUpdated = this._getTime();
        }

        // always update user information from every request
        if (apiItem.userInformation) {
            this._userInformation = {
                data: apiItem.userInformation,
                lastUpdated: this._getTime()
            };
        }

        this._persistLocalStorage();
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