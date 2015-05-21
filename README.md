# wanikani-api
A small Javascript Library to handle interaction with [Wanikani](https://wanikani.com)'s API.

The major idea is to allow simple interaction with the API without handling JSONP yourself, 
or using any external dependences (except perhaps an ES6 Promise polyfill).

## Usage

#### Installation
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

#### Querying Wanikani

You can then ask the created object for various information about the Wanikani user. 
All information is returned wrapped in an ES6 promise. All API response information is 
normalized from `snake_case` to `camelCase` for easier typing and recognition.

```javascript
wk.getStudyQueue().then(function(studyQueue) {
  console.log(studyQueue.reviewsAvailableNextHour);
  console.log(studyQueue.nextReviewDate);
});
```

Additionally, the WkApi will take care of caching requests for ten minutes by default. 
If you would like to change this caching time, you may use the `setExpiry(number)` method 
of the WkApi class. This number is in seconds.

```javascript
wk.setExpiry(120); // requests will be cached for 2 minutes
```

Lastly, the WkApi will update the `userInformation` object with every request, as it is included 
from the server with every request. Requesting, for example, the Study Queue, and then the User 
Information, will result in the User Information already being available for use.

## Documentation

Coming soon.