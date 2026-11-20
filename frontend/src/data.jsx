import { useCallback, useEffect, useState } from 'react'

export function useData(load, initial = null) {
  const [state, setState] = useState({ value: initial, loading: true, error: '' })
  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    setState({ value: initial, loading: true, error: '' })
    Promise.resolve().then(() => load(controller.signal)).then(
      (value) => { if (!controller.signal.aborted) setState({ value: value ?? initial, loading: false, error: '' }) },
      (failure) => { if (!controller.signal.aborted) setState({ value: initial, loading: false, error: failure.message }) },
    )
    return () => controller.abort()
  }, [load, initial, revision])
  return { ...state, retry }
}

export function usePages(load, size) {
  const [state, setState] = useState({ rows: [], loading: true, error: '', hasMore: false })
  const [current, setCurrent] = useState(1)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState((previous) => ({ ...previous, loading: true, error: '' }))
    load(current, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return
        const rows = Array.isArray(data) ? data : []
        setState((previous) => {
          const accumulated = current === 1 ? [] : previous.rows
          const byId = new Map([...accumulated, ...rows].map((row) => [row.id, row]))
          return { rows: [...byId.values()], loading: false, error: '', hasMore: rows.length >= size }
        })
      },
      (failure) => {
        if (!controller.signal.aborted) setState((previous) => ({ ...previous, loading: false, error: failure.message }))
      },
    )
    return () => controller.abort()
  }, [current, load, revision, size])
  return {
    ...state,
    more: state.hasMore ? () => setCurrent(current + 1) : undefined,
    retry: () => setRevision(revision + 1),
  }
}
