import { IWkCache, IUserInformationCache } from 'typings/cacheTypes';
import { IUserInformation } from 'typings/apiTypes';

export class WkCache implements IWkCache {
    private userInformation: IUserInformationCache;

    public getUserInformation(): IUserInformation {
        throw 'not implemented';
    }
}