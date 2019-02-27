import * as R from 'ramda'

export const isBlank = R.compose(
  R.isEmpty,
  R.trim,
)
