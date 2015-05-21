/// <reference path="./typings/promise.d.ts" />

import { ICache } from './typings/cacheTypes';
import { IApiResponse, IApiInformation, IUserInformation, IStudyQueue } from './typings/apiTypes';
import { IFetcher, Fetcher } from './fetcher';

export interface IWkCache {
    getUserInformation(): Promise<IUserInformation>;
    getStudyQueue(): Promise<IStudyQueue>;
    setExpiry(time: number): void;
}

export class WkCache implements IWkCache {
    private _fetcher: IFetcher;
    private _expiryTime: number = 3000; // seconds
    private _userInformation: ICache<IUserInformation> = <ICache<IUserInformation>> {};
    private _studyQueue: ICache<IStudyQueue> = <ICache<IStudyQueue>> {};
    
    constructor(apiKey: string) {
        this._fetcher = new Fetcher(apiKey);
    }
    
    // Returns the cached user information in a promise if still valid.
    // Otherwise, returns a promise containing incoming information
    public getUserInformation(): Promise<IUserInformation> {
        if (this.isValid(this._userInformation)) {
            return Promise.resolve<IUserInformation>(this._userInformation.data);
        }
        return new Promise<IUserInformation>((resolve, reject) => {
            let data = this._fetcher.getData('user-information');
            data.then((value: IApiResponse) => {
                this.setCacheItem(this._userInformation, value);
                resolve(value.userInformation);
            }).catch(() => {
                reject();
            });
        });
    }

    // Returns the cached study queue in a promise if still valid.
    // Otherwise returns a promise containing incoming information.
    public getStudyQueue(): Promise<IStudyQueue> {
        if (this.isValid(this._studyQueue)) {
            return Promise.resolve<IStudyQueue>(this._studyQueue.data);
        }
        return new Promise<IStudyQueue>((resolve, reject) => {
            let data = this._fetcher.getData('study-queue');
            data.then((value: IApiResponse) => {
                this.setCacheItem(this._studyQueue, value);
                resolve(value.requestedInformation);
            }).catch(() => {
                reject();
            });
        });
    }
    
    // Sets the expiry time in seconds
    public setExpiry(time: number): void {
        this._expiryTime = time;
    }

    private setCacheItem(cacheItem: ICache<{}>, apiItem: IApiResponse) {
        if (apiItem.requestedInformation) {
            cacheItem.data = apiItem.requestedInformation;
            cacheItem.lastUpdated = this.getTime();
        }

        // always update user information from every request
        if (apiItem.userInformation) {
            this._userInformation = {
                data: apiItem.userInformation,
                lastUpdated: this.getTime()
            };
        }
    }
    
    // Returns if the supplied cache item is still valid
    // based on the current expiry time
    private isValid(cacheItem: ICache<{}>): boolean {
        if (!cacheItem) return false;
        if (!cacheItem.lastUpdated) return false;
        let now = this.getTime();
        let maxValidity = cacheItem.lastUpdated + this._expiryTime;
        return maxValidity > now;
    }
    
    // Returns the current unix epoch time
    private getTime(): number {
        return (new Date()).getTime() / 1000;
    }
}