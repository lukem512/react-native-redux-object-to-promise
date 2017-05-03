import Token from './Token'

export default ({
  keyIn = 'promise',
  keyOut = 'promise',
  tokenKey = 'token-key',
  fetchOptions = {}
} = {}) => {
  const token = new Token(tokenKey)

  return () => next => action => {
    // check whether we need to transform the promise
    if (!action.meta || !action.meta[keyIn] || typeof action.meta[keyIn] !== 'object') {
      return next(action)
    }

    // check whether the fetch API is supported
    if (!self.fetch) {
      return new Error('Fetch not available. Please use `redux-object-to-promise`.')
    }

    const {
      method = 'GET',
      headers = {},
      catchToken = false,
      removeToken = false,
      authenticated = true,
      url: _url = '',
      data = {},
      ...rest
    } = action.meta[keyIn]

    if (authenticated) {
      headers['x-access-token'] = token.get()
    }

    if (method.toUpperCase() !== 'GET') {
      headers['Accept'] = 'application/json';
      headers['Content-Type'] = 'application/json';
    }

    const defaultTransform = function(response) {
      if (!response.ok) {
        return new Promise(function(resolve, reject) {
          return response.json().then(errData => reject(new Error(errData.message)));
        });
      }

      if (removeToken) {
        token.set(null)
      }
      const contentType = ['content-type'];

      if (contentType.indexOf('json')) {
        return response.json().then(function(data) {
          if (catchToken && data && data.token) {
            token.set(data.token);
          }
          return { data };
        });
      }

      return response;
    }

    const {transformResponse = [], ...restOfFetchOptions} = fetchOptions

    const url = fetchOptions.baseURL
      ? fetchOptions.baseURL + _url
      : _url

    let promise = fetch(url, {
      ...restOfFetchOptions,
      method: method.toUpperCase(),
      headers,
      ...(!!data && method.toUpperCase() !== 'GET') && {body: JSON.stringify(data)},
      ...rest
    }).then(defaultTransform)

    transformResponse.forEach(d => {
      promise = promise.then(d)
    })

    const actionToDispatch = {
      ...action,
      meta: {
        ...action.meta,
        [keyOut]: promise
      }
    }

    if (keyOut !== keyIn) {
      delete actionToDispatch.meta[keyIn]
    }

    return next(actionToDispatch)
  }
}
