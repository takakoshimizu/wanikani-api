/// <reference path="./promise.d.ts" />

export interface IFetcher {
    getData<T>(type: string, args?: number | string): Promise<T>;
}