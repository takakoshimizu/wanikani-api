# wanikani-api
A small Javascript Library to handle interaction with [Wanikani](https://wanikani.com)'s API.

The major idea is to allow simple interaction with the API without handling JSONP yourself, 
or using any external dependences (except perhaps an ES6 Promise polyfill).

This is a personal project to accomplish several goals. First, to provide a self-contained library 
for Wanikani users to easily create web applications or userscripts that run off of API Data. 
Secondly, to serve as a learning exercise, and get my work out into the OSS world. Lastly, to 
serve as a basis for future javascript framework learning exercises and OSS projects.

## Usage

#### Installation

###### Browser

Download the `wkapi.js` or `wkapi.min.js` file from the `dist` directory. 
Add that to your code in a script tag, and then instantiate a new instance of the object, 
passing in the desired API Key as an argument.

```html
<html>
  <head>
    <script type="text/javascript" src="wkapi.min.js"></script>
	<script type="text/javascript">
	  var wk = new WkApi('API_KEY');
	</script>
  </head>
</html>
```

Once that is done, the WkApi object `wk` is now available to query.

###### Server-side

WkApi does not yet support server-side usage. The internal JSONP fetcher will need
to be rewritten to support direct node-style requests.

#### Querying Wanikani

You can then ask the created object for various information about the Wanikani user. 
All information is returned wrapped in an ES6 promise. All API response information is 
normalized from `snake_case` to `camelCase` for easier typing and recognition.

```javascript
wk.getStudyQueue().then(function(studyQueue) {
  console.log(studyQueue.reviewsAvailableNextHour);
  console.log(studyQueue.nextReviewDate);
});

wk.getRadicals(5).then(function(radicals) {
	console.log('You studied ' + radicals.length + ' radicals in level 5.');
});

wk.getKanji([1,10]).then(function(kanji) {
	for (var k of kanji) {
		console.log(k.character + ' is read ' + k[k.importantReading]);
	}
});

wk.getVocabulary('1-10,15,20-30,35,40-50').then(function(radicals) {
	console.log('In levels 1-10, 15, 20-30, 35, and 40-50, you learned ' + radicals.length + ' words.');
});
```

Additionally, the WkApi will take care of caching requests for 1 hour by default. Caching is per method, 
except for `getRadicals`, `getKanji`, and `getVocabulary`, which cache individually for each level. 
If you would like to change this caching time, you may use the `setExpiry(number)` method 
of the WkApi class. This number is in seconds.

```javascript
wk.setExpiry(120); // requests will be cached for 2 minutes
```

The cache is stored after every request in the client's localStorage, so the cache will persist 
even when the browser is closed.

Lastly, the WkApi will update the `userInformation` object with every request, as it is included 
from the server with every request. Requesting, for example, the Study Queue, and then the User 
Information, will result in the User Information already being available for use.

## Documentation

#### Public Methods

The public interface for WkApi is defined as follows...

```typescript
export interface IWkApi {
    getUserInformation(): Promise<IUserInformation>;
    getStudyQueue(): Promise<IStudyQueue>;
    getLevelProgression(): Promise<ILevelProgress>;
    getSrsDistribution(): Promise<ISRSDistribution>;
    getRecentUnlocks(count: number): Promise<IRecentUnlock[]>;
    getCriticalItems(rate: number): Promise<ICriticalItem[]>;
    getRadicals(levels: number | number[] | string): Promise<IRadical[]>;
    getKanji(levels: number | number[] | string): Promise<IKanji[]>;
    getVocabulary(levels: number | number[] | string): Promise<IVocab[]>;
    setExpiry(time: number): void;
    setLevelsPerRequest(levels: number): void;
}
```

The classes methods are used as follows:
 - `WkApi`
   - `constructor(apiKey: string)` -> `WkApi Instance`
     - Multiple instances can be active with different API Keys. 
	 - Each instance will have its own cache.
	 - Each API Key will have the information cached to localStorage
   - `getUserInformation()` -> `ES6 Promise containing a User Information object.`
     - Matches the User Information as returned from the Wanikani API, except in camelCase.
	 - See `typings/apiTypes.d.ts` for more detailed structure.
   - `getStudyQueue()` -> `ES6 Promise containing a Study Queue object.`
     - Matches the Study Queue information as returned from the Wanikani API, except in camelCase.
	 - See `typings/apiTypes.d.ts` for more detailed structure.
   - `getLevelProgression()` -> `ES6 Promise containing a Level Progression object.`
     - Matches the Level Progression as returned from the Wanikani API, except in camelCase.
	 - See `typings/apiTypes.d.ts` for more detailed structure.
	 - These notes apply to all further methods. They will be omitted from here on.
   - `getSrsDistribution()` -> `ES6 Promise containing an SRS distribution object.`
   - `getRecentUnlocks(count: number)` -> `ES6 Promise containing an array of Recent Unlocks.`
     - The argument `count` can be between 1-100, and will return that many 
	 recent unlocks, ordered by unlock date descending.
   - `getCriticalItems(rate: number)` -> `ES6 Promise containing an array of Critical Items.`
     - The argument `rate` can be a number between 1-100, indicating a barrier of correct rate
	 to be considered a critical item.
   - `getRadicals(levels: number | number[] | string)` -> `ES6 promise containing an array of radicals.`
     - The argument `levels` can be a level number, an array of level numbers, or a comma-delimited 
	 string of levels to retrieve. They do not need to be in order, or contiguous.
	 - When using a `string` argument, levels can be specified in a range (eg '1-10').
	 - When using a `string` argument, single levels and multiple ranges can be interspersed (eg '1,5-10,15-30,33')
	 - Items are cached on a per-level basis.
	 - Only uncached levels will be requested from the server.
   - `getKanji(levels: number | number[] | string)` -> `ES6 promise containing an array of kanji.`
     - The argument `levels` is identical in usage to `getRadicals(number)`
	 - Items are cached on a per-level basis.
	 - Only uncached levels will be requested from the server.
	 - Large requests will be split into no more than 25 levels per request.
	 - Large requests will automatically be reassembled for the user.
   - `getVocabulary(levels: number | number[] | string)` -> `ES6 promise containing an array of vocabulary.`
     - The argument `levels` is identical in usage to `getRadicals(number)`
	 - Items are cached on a per-level basis.
	 - Only uncached levels will be requested from the server.
	 - Large requests will be split into no more than 25 levels per request.
	 - Large requests will automatically be reassembled for the user.
    - `setExpiry(time: number)` -> `void`
	  - The argument `time` is a number in seconds for the cache information to last.
	  - Defaults to 1 hour (3600 seconds)
	- `setLevelsPerRequest(levels: number)` -> `void`
	  - The argument `levels` is a number to indicate the maximum number of levels in a single request.
	  - This argument only applies to `getKanji(number)` and `getVocabulary(number)`
	  - Defaults to 25.