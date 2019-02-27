import React from 'react'

function Button(props) {
  return (
    <button
      role="button"
      className="br1 ba b--black-20 ttu mh1 f6"
      {...props}
    />
  )
}

export default Button
