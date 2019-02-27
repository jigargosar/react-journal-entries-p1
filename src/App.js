import React, { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { observable } from 'mobx'
import * as R from 'ramda'
import { getCached, setCache } from './cache-helpers'
import EntryItem from './comp/EntryItem'
import Hotkeys from 'react-hot-keys'
import Button from './comp/Button'
import PouchDb from 'pouchdb-browser'
import { _, it } from 'param.macro'
import faker from 'faker'
import validate from 'aproba'
import * as nanoid from 'nanoid'

const db = new PouchDb('journal-entries')

function useActions(setModel) {
  function wrapWithSetModel(updaters) {
    return R.mapObjIndexed(fn =>
      R.compose(
        setModel,
        fn,
      ),
    )(updaters)
  }

  return useMemo(
    () =>
      wrapWithSetModel({
        addNew: () =>
          R.mergeLeft({ newEntryContent: '', showNewEntry: true }),
        closeNew: () =>
          R.mergeLeft({ newEntryContent: '', showNewEntry: false }),
        setNewEntryContent: content =>
          R.mergeLeft({ newEntryContent: content }),
        setLastErrMsg(err) {
          console.error('setLastErrMsg', err)
          return R.assoc('lastErrMsg')(err.message)
        },
        handleEntryDbChange(change) {
          return model => {
            if (change.deleted) {
              return R.dissocPath(['entryById', change.id])(model)
            } else {
              const doc = change.doc
              return R.assocPath(['entryById', doc._id])(doc)(model)
            }
          }
        },
      }),
    [],
  )
}

function createNewEntry({ content }) {
  validate('O', arguments)
  validate('S', [content])

  return {
    _id: nanoid(),
    content: content,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  }
}

function useEffects(actions) {
  return useMemo(() => {
    const otherwiseHandlePouchDbError = R.otherwise(actions.setLastErrMsg)

    return {
      onFakeAddClicked: () => {
        const newEntry = createNewEntry({
          content: faker.lorem.paragraph(),
        })
        R.pipe(
          it.put(newEntry),
          otherwiseHandlePouchDbError,
        )(db)
      },
      onAddNewClicked: () => actions.addNew(),
      onNewEntryContentChange: e =>
        actions.setNewEntryContent(e.target.value),
      saveNewEntry: content => {
        const newEntry = createNewEntry({
          content: content,
        })
        R.pipe(
          it.put(newEntry),
          R.then(() => actions.closeNew()),
          otherwiseHandlePouchDbError,
        )(db)
      },
      onDeleteAllClicked: () =>
        R.pipe(
          it.allDocs({ include_docs: true }),
          R.then(
            R.pipe(
              R.prop('rows'),
              R.pluck('doc'),
              R.map(R.mergeLeft({ _deleted: true })),
              db.bulkDocs(_),
            ),
          ),
          R.then(console.log('bulkDocsResponse', _)),
          otherwiseHandlePouchDbError,
        )(db),
    }
  }, [])
}

function useAppModel() {
  const [model] = useState(() =>
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

  if (process.env.NODE_ENV !== 'production') {
    window.model = model
  }

  function setModel(fn) {
    const newModel = fn(model)
    R.forEachObjIndexed((v, k) => {
      model[k] = v
    })(newModel)
  }

  const actions = useActions(setModel)

  useEffect(() => setCache('appModel', model), [model])

  useEffect(() => {
    const changes = db
      .changes({ include_docs: true, live: true })
      .on('change', actions.handleEntryDbChange)
      .on('error', actions.setLastErrMsg)
    return () => changes.cancel()
  }, [])

  const effects = useEffects(actions)

  return [model, effects]
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
