import React from 'react'
import { observer } from 'mobx-react-lite'
import EntryItem from './comp/EntryItem'
import Button from './comp/Button'
import {
  getAllEntries,
  getDisplayEntries,
  useAppModel,
} from './useAppModel'
import NewEntryItem from './comp/NewEntryItem'

function App() {
  const [model, effects] = useAppModel()

  return (
    <div className="sans-serif lh-title measure-wide center">
      <div className="pv3">
        <input
          type="text"
          value={model.remoteUrl}
          onChange={effects.onRemoteUrlChange}
        />
      </div>
      <header className="flex items-center">
        <div
          className="f4 pv2"
          onClick={() => console.table(getAllEntries(model))}
        >
          Journal
        </div>
        <div className="flex-grow-1" />
        <Button onClick={effects.onAddNewClicked}>add new</Button>
        <Button onClick={effects.onFakeAddClicked}>add fake</Button>
        <Button onClick={effects.onDeleteAllClicked}>delete all</Button>
      </header>
      <div className="pv2" />
      {model.showNewEntry && (
        <NewEntryItem content={model.newEntryContent} effects={effects} />
      )}

      <div className="pv2" />
      {getDisplayEntries(model).map(entry => (
        <EntryItem key={entry._id} entry={entry} />
      ))}
    </div>
  )
}

export default observer(App)
