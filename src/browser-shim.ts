import { WkApi } from './wkapi';

if (window) {
	(<any>window).WkApi = WkApi;
}