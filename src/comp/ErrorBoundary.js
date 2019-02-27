import React, { Component } from 'react'

class ErrorBoundary extends Component {
  static g
  componentDidCatch(error, errorInfo) {}

  render() {
    return (
      <button
        role="button"
        className="br1 ba b--black-20 ttu mh1 f6"
        {...this.props}
      />
    )
  }
}

export default ErrorBoundary
