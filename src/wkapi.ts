import { IUserInformation, IStudyQueue, ILevelProgress } from './typings/apiTypes';
import { IWkCache, WkCache } from './wkCache';

export class WkApi {
    private _cache: IWkCache;

    constructor(private _apiKey: string) {
        // validate apiKey format
        if (_apiKey.length !== 32 || !_apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }

        this._cache = new WkCache(_apiKey);
        this.setExpiry(120); // testing mode
    }
    
    // Sets the cache expiry time in seconds
    public setExpiry(time: number): void {
        this._cache.setExpiry(time);
    }
    
    // Returns the User Information segment cached off
    // the latest request, wrapped in a Promise
    public getUserInformation(): Promise<IUserInformation> {
        return this._cache.getUserInformation();
    }

    // Returns the current user's study queue
    public getStudyQueue(): Promise<IStudyQueue> {
        return this._cache.getStudyQueue();
    }

    // Returns the current user's level progression
    public getLevelProgression(): Promise<ILevelProgress> {
        return this._cache.getLevelProgression();
    }
}