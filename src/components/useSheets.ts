'use client'
import { useState, useCallback, useRef } from 'react'
import type { SheetData, Row } from '@/lib/sheets'
import { BINARY_COLS } from '@/lib/sheets'

const CACHE_TTL_MS = 60_000

export const DIAS = [
  { sigla:'SEG/', label:'Seg',  extra:null as string|null },
  { sigla:'TER/', label:'Ter',  extra:null },
  { sigla:'QUA/', label:'Qua',  extra:null },
  { sigla:'QUI/', label:'Qui',  extra:'QUI/SAB/' },
  { sigla:'SEX/', label:'Sex',  extra:null },
  { sigla:'SAB/', label:'Sáb',  extra:'QUI/SAB/' },
]

export function detectarDia(): number | null {
  return ({1:0,2:1,3:2,4:3,5:4,6:5} as Record<number,number>)[new Date().getDay()] ?? null
}

export function isOk(v: string): boolean {
  const s = v.trim()
  return s === '1' || s.includes('✔') || s.toLowerCase() === 'sim' || s.toLowerCase() === 'true'
}

export function cuponsOk(v: string): boolean {
  const n = parseFloat(v.replace(',','.'))
  return !isNaN(n) && n >= 20
}

export function filtrar(
  rows: Row[], setor: string, dia: number|null,
  mix: string, op: string,
  taskTtc: string, taskFat: string, cupons: string, visitaGv: string
): Row[] {
  return rows.filter(r => {
    if (setor && r['Setor'] !== setor) return false
    if (dia !== null) {
      const marc = [DIAS[dia].sigla, ...(DIAS[dia].extra ? [DIAS[dia].extra!] : [])]
      if (!marc.some(m => (r['Freq. Visita']||'').includes(m))) return false
    }
    if (mix      === 'ok'  && !isOk(r['Mix OK']||''))       return false
    if (mix      === 'nok' && isOk(r['Mix OK']||''))         return false
    if (taskTtc  === 'ok'  && !isOk(r['Task TTC']||''))      return false
    if (taskTtc  === 'nok' && isOk(r['Task TTC']||''))       return false
    if (taskFat  === 'ok'  && !isOk(r['Task Fat.']||''))     return false
    if (taskFat  === 'nok' && isOk(r['Task Fat.']||''))      return false
    if (visitaGv === 'ok'  && !isOk(r['Visita GV']||''))     return false
    if (visitaGv === 'nok' && isOk(r['Visita GV']||''))      return false
    if (cupons   === 'ok'  && !cuponsOk(r['Cupons']||''))    return false
    if (cupons   === 'nok' && cuponsOk(r['Cupons']||''))     return false
    if (op && !(r['OPERAÇÃO']||'').toLowerCase().includes(op.toLowerCase())) return false
    return true
  })
}

export { BINARY_COLS }

let _cache: { he: SheetData; core: SheetData; lastModified: string|null; ts: number } | null = null
let _pending: Promise<void> | null = null

export function useSheets() {
  const [heData,       setHe]       = useState<SheetData|null>(_cache?.he   ?? null)
  const [coreData,     setCore]     = useState<SheetData|null>(_cache?.core  ?? null)
  const [lastModified, setLastMod]  = useState<string|null>(_cache?.lastModified ?? null)
  const [loading,      setLoading]  = useState(false)
  const [error,        setError]    = useState<string|null>(null)
  const fetching = useRef(false)

  const load = useCallback(async (force = false) => {
    const cache = _cache
    const cacheFresh = cache && Date.now() - cache.ts < CACHE_TTL_MS
    if (cacheFresh && !force) { setHe(cache.he); setCore(cache.core); setLastMod(cache.lastModified); return }
    if (_pending && !force) {
      setLoading(true); setError(null)
      try {
        await _pending
        if (_cache) { setHe(_cache.he); setCore(_cache.core); setLastMod(_cache.lastModified) }
      } catch(e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
      return
    }
    if (fetching.current) return
    fetching.current = true
    setLoading(true); setError(null)
    _pending = (async () => {
      const res = await fetch(`/api/sheets${force ? '?refresh=1' : ''}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      _cache = { he: json.he, core: json.core, lastModified: json.lastModified ?? null, ts: Date.now() }
      setHe(json.he); setCore(json.core); setLastMod(json.lastModified ?? null)
    })()
    try {
      await _pending
    } catch(e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false); fetching.current = false; _pending = null
    }
  }, [])

  const reload = () => { _cache = null; load(true) }
  return { heData, coreData, loading, error, lastModified, load, reload }
}
