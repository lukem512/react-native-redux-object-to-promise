react-native-redux-object-to-promise
=============

[![npm version](https://img.shields.io/npm/v/react-native-redux-object-to-promise.svg?style=flat-square)](https://www.npmjs.com/package/react-native-redux-object-to-promise)

Redux [middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) middleware to transform an object into a promise. Uses `fetch` and `AsyncStorage`.

```js
npm install --save redux-optimist-promise
```

## Usage in middlewares

First, import the middleware creator and include it in `applyMiddleware` when creating the Redux store. **You need to call it as a function (See later why on configuration section below):**

```js
import middleware from 'react-native-redux-object-to-promise';

composeStoreWithMiddleware = applyMiddleware(
	middleware({
	  keyIn = 'promise',
	  keyOut = 'promise',
		tokenKey = 'token-key',
	  fetchOptions = {}
	})
)(createStore);

```

To use the middleware, dispatch a `promise` property within the `meta` of the action.

Example:

The below action creator, when triggered `dispatch(addTodo('use react-native-redux-object-to-promise'))`

```js
export function addTodo(text) {
	return {
		type: 'ADD_TODO',
		payload: {
			text
		},
		meta: {
			promise: {url: '/todo', method: 'post', data: {text}},
		}
	};
}
```

will dispatch
```js
{
	type: 'ADD_TODO',
	payload: {
		text: 'use react-native-redux-optimist-promise'
	},
	promise: Promise({url: '/todo', method: 'post', data: {text}})
}
```

## License

  MIT
