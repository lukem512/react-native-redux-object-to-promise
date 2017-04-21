import Token from './Token'

export const driver = {
  AXIOS: 'AXIOS',
  FETCH: 'FETCH'
};

export default ({
  keyIn = 'promise',
  keyOut = 'promise',
  driver = driver.AXIOS,
  driverOptions: _driverOptions = {},
  tokenOptions = {},
  axiosOptions
} = {}) => {
  const token = new Token(tokenOptions)

  return () => next => action => {
    // check if we don't need to transform the promise
    if (!action.meta || !action.meta[keyIn] || typeof action.meta[keyIn] !== 'object') {
      return next(action)
    }

    const driverOptions = _driverOptions || axiosOptions

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

    const {transformResponse = [], ...restOfDriverOptions} = driverOptions

    let promise
    switch(driver) {
      case driver.FETCH:
        const fetch = require('node-fetch')

        const url = driverOptions.baseURL
          ? driverOptions.baseURL + driverOptions.url
          : driverOptions.url

        promise = fetch(url, {
          ...restOfDriverOptions,
          method: method.toUpperCase(),
          headers,
          body: driverOptions.data,
          ...rest
        }).then(defaultTransform)

        transformResponse.forEach(d => {
          promise = promise.then(d)
        })
      break

      case driver.AXIOS:
      default:
        const axios = require('axios');

        const promise = axios({
          ...restOfDriverOptions,
          method: method.toLowerCase(),
          headers,
          transformResponse: [defaultTransform, ...transformResponse],
          ...rest
        })
      break
    }

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
