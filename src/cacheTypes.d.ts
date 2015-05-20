import { IUserInformation } from 'apiTypes';

export interface ICache {
    lastUpdated: number;
}

export interface IUserInformationCache extends ICache {
    userInformation: IUserInformation;
}