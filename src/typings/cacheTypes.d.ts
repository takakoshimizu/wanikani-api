import { IUserInformation, IStudyQueue } from 'apiTypes';

export interface ICache<T> {
    lastUpdated: number;
    data: T;
}