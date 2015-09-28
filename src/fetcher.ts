/// <reference path="typings/promise.d.ts" />

import { IFetcher } from './typings/fetcher';
import { IApiResponse } from './typings/apiTypes';
import { jsonp } from './util/jsonp';

export default class Fetcher implements IFetcher {
	private API_BASE = 'https://www.wanikani.com/api/v1.3/user/';
	
	constructor(private _apiKey: string){}
	
	// Gets an API URL with the /type/ and optionally a limit.
	// Returns a promise that will contain the requested data.
	public getData<T>(type: string, args?: number | string): Promise<T> {
		return jsonp<T>(this.constructUrl(type, args));
	}
	
	// Constructs an API URL to access the requested data.
	private constructUrl(type: string, args?: number | string): string {
		let url = this.API_BASE + this._apiKey + '/' + type + '/';
		if (args) {
			url += args + '/';
		}
		return url;
	}
}