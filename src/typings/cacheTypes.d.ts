import { IUserInformation } from 'apiTypes';

export interface IWkCache {
    getUserInformation(): Promise<IUserInformation>;
    setExpiry(time: number): void;
}

export interface ICache {
    lastUpdated: number;
}

export interface IUserInformationCache extends ICache {
    userInformation: IUserInformation;
}