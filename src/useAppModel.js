import { useEffect, useMemo } from 'react'
import * as R from 'ramda'
import faker from 'faker'
import PouchDb from 'pouchdb-browser'
import { _, it } from 'param.macro'
import validate from 'aproba'
import * as nanoid from 'nanoid'
import hotkeys from 'hotkeys-js'
import { isBlank } from './ramda-helpers'
import { useCachedObservable } from './mobx-helpers'

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
        openNew: () => R.mergeLeft({ showNewEntry: true }),
        clearAndCloseNew: () =>
          R.mergeLeft({ newEntryContent: '', showNewEntry: false }),
        closeNew: () => R.mergeLeft({ showNewEntry: false }),
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
    _id: `e_${nanoid()}`,
    content: content,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  }
}

function useEffects(actions, model) {
  return useMemo(() => {
    const otherwiseHandlePouchDbError = R.otherwise(actions.setLastErrMsg)

    const openNewAndFocus = () => {
      actions.openNew()

      requestAnimationFrame(() => {
        const el = document.getElementById('new-entry-input')
        el.focus()
      })
    }
    return {
      onRemoteUrlChange: () => {},
      onFakeAddClicked: () => {
        const newEntry = createNewEntry({
          content: faker.lorem.paragraph(),
        })
        R.pipe(
          it.put(newEntry),
          otherwiseHandlePouchDbError,
        )(db)
      },
      onAddNewHotKey: openNewAndFocus,
      onAddNewClicked: openNewAndFocus,
      onNewEntryContentChange: e =>
        actions.setNewEntryContent(e.target.value),
      closeNewEntry: () => actions.closeNew(),
      saveNewEntry: () => {
        if (isBlank(model.newEntryContent)) {
          actions.clearAndCloseNew()
        } else {
          const newEntry = createNewEntry({
            content: model.newEntryContent,
          })
          R.pipe(
            it.put(newEntry),
            R.then(() => actions.clearAndCloseNew()),
            otherwiseHandlePouchDbError,
          )(db)
        }
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

function useEntryDbChangeEffect(actions) {
  useEffect(() => {
    const changes = db
      .changes({ include_docs: true, live: true })
      .on('change', actions.handleEntryDbChange)
      .on('error', actions.setLastErrMsg)
    return () => changes.cancel()
  }, [])
}

export function useAppModel() {
  const model = useCachedObservable(
    {
      entryById: {},
      lastErrMsg: null,
      showNewEntry: false,
      newEntryContent: '',
      remoteUrl: '',
    },
    'appModel',
  )

  if (process.env.NODE_ENV !== 'production') {
    window.model = model
  }

  const setModel = R.compose(
    R.forEachObjIndexed((v, k) => {
      model[k] = v
    }),
    R.applyTo(model),
  )
  const actions = useActions(setModel)

  useEntryDbChangeEffect(actions)

  const effects = useEffects(actions, model)

  useEffect(() => {
    hotkeys('n', 'other', event => {
      effects.onAddNewHotKey()
      event.preventDefault()
    })

    return () => hotkeys.unbind('n', 'other')
  }, [])

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
