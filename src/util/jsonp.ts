/// <reference path="../typings/promise.d.ts" />

import { convertCase } from './objectConvert';

// Creates a JSONP request with a promise result
export var jsonp = <T>(url: string): Promise<T> => {	
	if (!(<any>window).Promise) {
		throw 'Promise not available. Please apply a polyfill.';
	}

	var createScript = (url: string, callbackName: string): HTMLScriptElement => {
	    let script = document.createElement('script');
	    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
	    return script;
	};

	return new Promise<T>((resolve, reject) => {
		let callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
		let script = createScript(url, callbackName);
		
		script.onerror = reject;
		
		document.body.appendChild(script);
        (<any>window)[callbackName] = (data: any) => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(convertCase(data));
            }
			
			(<any>window)[callbackName] = null;
			delete (<any>window)[callbackName];
			document.body.removeChild(script);
		};
	});
};