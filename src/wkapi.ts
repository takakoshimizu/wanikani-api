import { IUserInformation, IStudyQueue} from 'typings/apiTypes';
import { IWkCache } from 'typings/cacheTypes';
import { WkCache } from 'wkCache';

export class WkApi {
    private cache: IWkCache;

    constructor(private apiKey: string) {
        // validate apiKey format
        if (apiKey.length !== 32 || !apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }

        this.cache = new WkCache();
    }
    public userInformation(): IUserInformation {
        var userInfo: IUserInformation = this.cache.getUserInformation();
        if (userInfo) return userInfo;

        throw 'requests not implemented';
    }

    public studyQueue(): IStudyQueue {
        throw 'not yet implemented';
    }
}