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

    const {
      method = 'get',
      headers = {},
      catchToken = false,
      removeToken = false,
      authenticated = true,
      ...rest
    } = action.meta[keyIn]

    if (authenticated) {
      headers['x-access-token'] = token.get()
    }

    const defaultTransform = function(data) {
      if (removeToken) {
        token.set(null)
      }
      try {
        const parsedData = JSON.parse(data)
        if (catchToken && parsedData && parsedData.token) {
          token.set(parsedData.token)
        }
        return parsedData
      } catch (e) {
        return data
      }
    }

    const {transformResponse = [], ...restOfFetchOptions} = fetchOptions
    const url = fetchOptions.baseURL
      ? fetchOptions.baseURL + fetchOptions.url
      : fetchOptions.url

    promise = fetch(url, {
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
