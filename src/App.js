import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { observable } from 'mobx'
import * as R from 'ramda'
import { getCached } from './cache-helpers'
import EntryItem from './comp/EntryItem'
import Hotkeys from 'react-hot-keys'
import Button from './comp/Button'

function useAppModel() {
  return useState(() =>
    R.compose(
      observable.object,
      R.mergeDeepRight({
        entryById: {},
        lastErrMsg: null,
        showNewEntry: false,
        newEntryContent: '',
      }),
      R.defaultTo({}),
      getCached,
    )('appModel'),
  )
}

export function getDisplayEntries(model) {
  return R.compose(
    R.sortWith([R.descend(R.prop('createdAt'))]),
    R.values,
  )(model.entryById)
}

export function getAllEntries(model) {
  return R.values(model.entryById)
}

function NewEntryItem({ content, effects }) {
  return (
    <div className="pv2 code">
      <Hotkeys
        keyName="control+enter,command+enter"
        onKeyDown={kn => {
          switch (kn) {
            case 'control+enter':
            case 'command+enter':
              return effects.saveNewEntry(content)
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

function App() {
  const [model, effects] = useAppModel()

  return (
    <div className="sans-serif lh-title measure-wide center">
      <header className="flex items-center">
        <div
          className="f4 pv2"
          onClick={() => console.table(getAllEntries(model))}
        >
          Journal Entries
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
