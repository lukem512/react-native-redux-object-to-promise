import { AsyncStorage } from 'react-native';

export default (key = 'token-key') => {
  let token = ''
  const getter = AsyncStorage.getItem(key)
  if (typeof getter === 'string') {
    token = getter
  } else if (getter && getter.then) {
    getter.then((res) => { token = res })
  }
  return {
    set (t) {
      token = t
      return AsyncStorage.setItem(key, t)
    },
    get () {
      return token
    }
  }
}
