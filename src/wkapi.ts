import { IUserInformation, IStudyQueue} from './typings/apiTypes';
import { IWkCache } from './typings/cacheTypes';
import { WkCache } from './wkCache';

export class WkApi {
    private cache: IWkCache;

    constructor(private apiKey: string) {
        // validate apiKey format
        if (apiKey.length !== 32 || !apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }

        this.cache = new WkCache(apiKey);
        this.setExpiry(120); // testing mode
    }
    
    // Sets the cache expiry time in seconds
    public setExpiry(time: number): void {
        this.cache.setExpiry(time);
    }
    
    // Returns the User Information segment cached off
    // the latest request.
    public userInformation(): Promise<IUserInformation> {
        return this.cache.getUserInformation();
    }

    // Returns the current user's study queue
    public studyQueue(): IStudyQueue {
        throw 'not yet implemented';
    }
}