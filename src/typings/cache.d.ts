export interface ICache<T> {
    lastUpdated: number;
    data: T;
}

export interface ILevelCache<T> {
    [key: number]: ICache<T>;
}