import { IUserInformation } from 'apiTypes';

export interface IWkCache {
    getUserInformation(): IUserInformation;
}

export interface ICache {
    lastUpdated: number;
}

export interface IUserInformationCache extends ICache {
    userInformation: IUserInformation;
}