import validate from 'aproba'
import { useState } from 'react'
import * as R from 'ramda'
import { observable } from 'mobx'
import { getCached, setCache } from './cache-helpers'
import { useDisposable } from 'mobx-react-lite'

export function useCachedObservable(defaults, cacheKey) {
  validate('OS', arguments)

  const [model] = useState(() =>
    R.compose(
      observable.object,
      R.mergeDeepRight(defaults),
      R.defaultTo({}),
      getCached,
    )(cacheKey),
  )

  useDisposable(() => setCache(cacheKey, model), [])
  return model
}
