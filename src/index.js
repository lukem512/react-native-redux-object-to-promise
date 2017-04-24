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
      method = 'get',
      headers = {},
      catchToken = false,
      removeToken = false,
      authenticated = true,
      url: _url = '',
      ...rest
    } = action.meta[keyIn]

    if (authenticated) {
      headers['x-access-token'] = token.get()
    }

    const defaultTransform = function(response) {
      if (removeToken) {
        token.set(null)
      }

      const headers = response.headers || {};
      const map = headers.map || {};
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
      body: fetchOptions.data,
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
