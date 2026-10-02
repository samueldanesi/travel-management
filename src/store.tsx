import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DB, Pratica } from './data/types'
import { buildInitialDB } from './data/mock'
import { iso, TODAY } from './lib/format'

const KEY = 'castruccio-viaggi-demo-v5'

interface Persisted {
  day: string
  db: DB
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Persisted
      // Le date del mock sono relative a oggi: si rigenerano ogni giorno per mantenerle coerenti
      if (p.day === iso(TODAY)) return p.db
    }
  } catch {
    /* localStorage non disponibile: si usa il dataset in memoria */
  }
  return buildInitialDB()
}

interface Ctx {
  db: DB
  update: (fn: (db: DB) => DB) => void
  updatePratica: (id: string, fn: (p: Pratica) => Pratica) => void
  reset: () => void
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ day: iso(TODAY), db } satisfies Persisted))
    } catch {
      /* ignora */
    }
  }, [db])

  const update = useCallback((fn: (db: DB) => DB) => setDb((d) => fn(d)), [])
  const updatePratica = useCallback(
    (id: string, fn: (p: Pratica) => Pratica) => setDb((d) => ({ ...d, pratiche: d.pratiche.map((p) => (p.id === id ? fn(p) : p)) })),
    []
  )
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignora */
    }
    setDb(buildInitialDB())
  }, [])

  const value = useMemo(() => ({ db, update, updatePratica, reset }), [db, update, updatePratica, reset])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore fuori da StoreProvider')
  return c
}
