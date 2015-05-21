/// <reference path="typings/promise.d.ts" />

import { IApiResponse } from './typings/apiTypes';
import { jsonp } from './util/jsonp';

export interface IFetcher {
	getData<T>(type: string, limit?: number): Promise<T>;
}

export class Fetcher implements IFetcher {
	private API_BASE = 'https://www.wanikani.com/api/v1.3/user/';
	
	constructor(private _apiKey: string){}
	
	// Gets an API URL with the /type/ and optionally a limit.
	// Returns a promise that will contain the requested data.
	public getData<T>(type: string, limit?: number): Promise<T> {
		return jsonp<T>(this.constructUrl(type, limit));
	}
	
	// Constructs an API URL to access the requested data.
	private constructUrl(type: string, limit?: number): string {
		let url = this.API_BASE + this._apiKey + '/' + type + '/';
		if (limit) {
			url += url + limit + '/';
		}
		return url;
	}
}