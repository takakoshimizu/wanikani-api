import { IUserInformation, IStudyQueue} from 'apiTypes';
import { WkCache } from 'wkCache';

export class WkApi {
    private cache: WkCache;

    constructor(private apiKey: string) {
        // validate apiKey format
        if (apiKey.length !== 32 || !apiKey.match(/[A-z0-9]{32}/)) {
            throw 'Invalid API Key. API Key must be 32 alphanumeric characters in length.';
        }

        this.cache = new WkCache();
    }
    public userInformation(): IUserInformation {
        throw 'not yet implemented';
    }

    public studyQueue(): IStudyQueue {
        throw 'not yet implemented';
    }
}