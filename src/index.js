import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'

function render() {
  ReactDOM.render(<App />, document.getElementById('root'))
}

render()

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()

if (module.hot) {
  setTimeout(console.clear, 0)
  module.hot.accept(['./App'], () => {
    render()
    setTimeout(console.clear, 0)
  })
}
