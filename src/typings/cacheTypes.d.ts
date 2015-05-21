import { IUserInformation, IStudyQueue } from 'apiTypes';

export interface IWkCache {
    getUserInformation(): Promise<IUserInformation>;
    getStudyQueue(): Promise<IStudyQueue>;
    setExpiry(time: number): void;
}

export interface ICache<T> {
    lastUpdated: number;
    data: T;
}