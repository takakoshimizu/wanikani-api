/// <reference path="./typings/promise.d.ts" />

import {
    IApiResponse, IApiInformation, IUserInformation,
    IStudyQueue, ILevelProgress, ISRSDistribution,
    IRecentUnlock, ICriticalItem } from './typings/apiTypes';
import { IFetcher, Fetcher } from './fetcher';

interface ICache<T> {
    lastUpdated: number;
    data: T;
}

export interface IWkApi {
    getUserInformation(): Promise<IUserInformation>;
    getStudyQueue(): Promise<IStudyQueue>;
    getLevelProgression(): Promise<ILevelProgress>;
    getSrsDistribution(): Promise<ISRSDistribution>;
    getRecentUnlocks(count: number): Promise<IRecentUnlock[]>;
    setExpiry(time: number): void;
}

export class WkApi implements IWkApi {
    private _fetcher: IFetcher;
    private _expiryTime: number = 3600; // seconds
    private _lastCriticalRate: number = 0;
    private _userInformation: ICache<IUserInformation> = <ICache<IUserInformation>> {};
    private _studyQueue: ICache<IStudyQueue> = <ICache<IStudyQueue>> {};
    private _levelProgress: ICache<ILevelProgress> = <ICache<ILevelProgress>> {};
    private _srsDistribution: ICache<ISRSDistribution> = <ICache<ISRSDistribution>> {};
    private _recentUnlocks: ICache<IRecentUnlock[]> = <ICache<IRecentUnlock[]>> {};
    private _criticalItems: ICache<ICriticalItem[]> = <ICache<ICriticalItem[]>> {};

    private _storageKeys = ['_userInformation', '_studyQueue', '_levelProgress',
        '_srsDistribution', '_recentUnlocks', '_criticalItems',
        '_lastCriticalRate'];
    
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
    
    // Sets the expiry time in seconds
    public setExpiry(time: number): void {
        this._expiryTime = time;
    }

    private _setCacheItem(cacheItem: ICache<{}>, apiItem: IApiResponse<{}>) {
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
    private _loadLocalStorage() {
        for (let key of this._storageKeys) {
            if (window.localStorage.getItem(key)) {
                (<any>this)[key] = JSON.parse(window.localStorage.getItem(key));
            }
        }
    }

    // Persists all information to localStorage
    private _persistLocalStorage() {
        for (let key of this._storageKeys) {
            if ((<any>this)[key]) {
                window.localStorage.setItem(key, JSON.stringify((<any>this)[key]));
            }
        }
    }

    // Clears all used localStorage
    private _clearLocalStorage() {
        window.localStorage.clear();
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