import React from 'react'
import { observer } from 'mobx-react-lite'

function Button(props) {
  return (
    <button
      role="button"
      className="br1 ba b--black-20 ttu mh1 f6"
      {...props}
    />
  )
}

export default observer(Button)
