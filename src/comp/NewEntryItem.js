import React from 'react'
import Hotkeys from 'react-hot-keys'
import { observer } from 'mobx-react-lite'

function NewEntryItem({ content, effects }) {
  return (
    <div className="pv2 code">
      <Hotkeys
        keyName="control+enter,command+enter,esc"
        onKeyDown={kn => {
          switch (kn) {
            case 'control+enter':
            case 'command+enter':
              return effects.saveNewEntry()
            case 'esc':
              return effects.closeNewEntry()
            default:
              break
          }
        }}
      >
        <textarea
          id="new-entry-input"
          autoFocus
          className="w-100 pa2 ma0"
          style={{ minHeight: 200 }}
          value={content}
          onChange={effects.onNewEntryContentChange}
        />
      </Hotkeys>
    </div>
  )
}

export default observer(NewEntryItem)
