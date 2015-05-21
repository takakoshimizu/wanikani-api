/// <reference path="./typings/promise.d.ts" />

import { IWkCache, ICache, IUserInformationCache } from './typings/cacheTypes';
import { IUserInformation } from './typings/apiTypes';
import { IFetcher, Fetcher } from './fetcher';

export class WkCache implements IWkCache {
    private fetcher: IFetcher;
    private expiryTime: number = 3000; // seconds
    private userInformation: IUserInformationCache;
    
    constructor(apiKey: string) {
        this.fetcher = new Fetcher(apiKey);
    }
    
    // Returns the cached user information in a promise if still valid.
    // Otherwise, returns a promise containing incoming information
    public getUserInformation(): Promise<IUserInformation> {
        if (this.isValid(this.userInformation)) {
            return Promise.resolve<IUserInformation>(this.userInformation.userInformation);
        }
        return this.fetcher.getData<IUserInformation>('user_information');
    }
    
    // Sets the expiry time in seconds
    public setExpiry(time: number): void {
        this.expiryTime = time;
    }
    
    // Returns if the supplied cache item is still valid
    // based on the current expiry time
    private isValid(cacheItem: ICache): boolean {
        let now = this.getTime();
        let maxValidity = cacheItem.lastUpdated + this.expiryTime;
        return now > maxValidity;
    }
    
    // Returns the current unix epoch time
    private getTime(): number {
        return (new Date()).getTime() / 1000;
    }
}