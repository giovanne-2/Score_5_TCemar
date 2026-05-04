'use client'

import { useState, useCallback, useRef } from 'react'
import type { Row, SheetData } from '@/lib/sheets'
import { BINARY_COLS } from '@/lib/sheets'
import styles from './page.module.css'

// ── Dias da semana ────────────────────────────────────────────────
const DIAS = [
  { sigla: 'SEG/', label: 'Seg', extra: null },
  { sigla: 'TER/', label: 'Ter', extra: null },
  { sigla: 'QUA/', label: 'Qua', extra: null },
  { sigla: 'QUI/', label: 'Qui*', extra: 'QUI/SAB/' },
  { sigla: 'SEX/', label: 'Sex', extra: null },
  { sigla: 'SAB/', label: 'Sáb*', extra: 'QUI/SAB/' },
]

function detectarDia(): number | null {
  const map: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }
  return map[new Date().getDay()] ?? null
}

// ── Filtragem client-side ─────────────────────────────────────────
function filtrar(
  dados: Row[],
  setor: string,
  dia: number | null,
  mix: string,
  op: string
): Row[] {
  return dados.filter(row => {
    if (setor && row['Setor'] !== setor) return false
    if (dia !== null) {
      const marc = [DIAS[dia].sigla]
      if (DIAS[dia].extra) marc.push(DIAS[dia].extra!)
      const v = row['Freq. Visita'] || ''
      if (!marc.some(m => v.includes(m))) return false
    }
    if (mix === 'ok'  && !(row['Mix OK'] || '').includes('✔')) return false
    if (mix === 'nok' && !(row['Mix OK'] || '').includes('❌')) return false
    if (op && !(row['OPERAÇÃO'] || '').toLowerCase().includes(op.toLowerCase())) return false
    return true
  })
}

// ── Célula com formatação especial ───────────────────────────────
function Cell({ col, value }: { col: string; value: string }) {
  if (col === 'Mix OK') {
    if (value.includes('✔')) return <span className={styles.bok}>✔</span>
    if (value.includes('❌')) return <span className={styles.bnok}>✗</span>
    return <span className={styles.zero}>—</span>
  }
  if (BINARY_COLS.has(col)) {
    const n = parseInt(value, 10)
    return n > 0
      ? <span className={styles.bok}>{n > 1 ? n : '✔'}</span>
      : <span className={styles.zero}>—</span>
  }
  return <span title={value}>{value || <span className={styles.zero}>—</span>}</span>
}

// ── Tabela ────────────────────────────────────────────────────────
function DataTable({ rows, headers }: { rows: Row[]; headers: string[] }) {
  if (!rows.length) return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>📭</div>
      Nenhum registro com esses filtros.
    </div>
  )
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {headers.map(h => (
                <td key={h}><Cell col={h} value={row[h] || ''} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────
export default function Home() {
  // Filtros
  const [setor, setSetor]   = useState('')
  const [dia, setDia]       = useState<number | null>(() => detectarDia())
  const [mix, setMix]       = useState('')
  const [op, setOp]         = useState('')

  // Dados
  const [heData,   setHeData]   = useState<SheetData | null>(null)
  const [coreData, setCoreData] = useState<SheetData | null>(null)
  const [resHE,    setResHE]    = useState<Row[]>([])
  const [resCore,  setResCore]  = useState<Row[]>([])

  // UI
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [aba,      setAba]      = useState<'he' | 'core'>('he')
  const [lastSync, setLastSync] = useState<string | null>(null)

  const rawHE   = useRef<SheetData | null>(null)
  const rawCore = useRef<SheetData | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Carrega dados só se ainda não tiver (ou forçar reload)
      if (!rawHE.current || !rawCore.current) {
        const res = await fetch('/api/sheets')
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        rawHE.current   = json.he
        rawCore.current = json.core
        setHeData(json.he)
        setCoreData(json.core)
        const now = new Date()
        setLastSync(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`)
      }

      const he   = rawHE.current!
      const core = rawCore.current!

      setResHE(filtrar(he.rows,   setor, dia, mix, op))
      setResCore(filtrar(core.rows, setor, dia, mix, op))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [setor, dia, mix, op])

  const recarregar = () => {
    rawHE.current   = null
    rawCore.current = null
    setHeData(null)
    setCoreData(null)
    setLastSync(null)
    buscar()
  }

  const limpar = () => {
    setSetor('')
    setMix('')
    setOp('')
    setDia(detectarDia())
    rawHE.current   = null
    rawCore.current = null
    setResHE([])
    setResCore([])
    setLastSync(null)
    setError(null)
  }

  const mixOkHE   = resHE.filter(r   => (r['Mix OK'] || '').includes('✔')).length
  const mixOkCore = resCore.filter(r  => (r['Mix OK'] || '').includes('✔')).length
  const total     = resHE.length + resCore.length
  const mixTot    = mixOkHE + mixOkCore
  const hasResult = resHE.length > 0 || resCore.length > 0

  const currentRows    = aba === 'he' ? resHE   : resCore
  const currentHeaders = aba === 'he' ? (heData?.headers   ?? []) : (coreData?.headers ?? [])

  return (
    <div className={styles.page}>
      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.logo}>S5</div>
          <h1 className={styles.appTitle}>Score 5</h1>
        </div>
        <div className={styles.topbarRight}>
          {lastSync && <span className={styles.lastSync}>Atualizado às {lastSync}</span>}
          <button className={styles.syncBtn} onClick={recarregar} disabled={loading}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
              <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5M13.5 2.5v3h-3"/>
            </svg>
            Atualizar
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* ── Filtros ── */}
        <div className={styles.filtersCard}>
          <p className={styles.filtersLabel}>Filtros</p>
          <div className={styles.filtersRow}>

            <div className={styles.fg}>
              <label>Setor</label>
              <input
                value={setor}
                onChange={e => setSetor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ex: 233"
                maxLength={10}
              />
            </div>

            <div className={styles.fg}>
              <label>Dia de visita <span className={styles.hint}>* inclui QUI/SAB/</span></label>
              <div className={styles.pills}>
                <button
                  className={`${styles.pill} ${dia === null ? styles.pillOn : ''}`}
                  onClick={() => setDia(null)}
                >Todos</button>
                {DIAS.map((d, i) => (
                  <button
                    key={i}
                    className={`${styles.pill} ${d.extra ? styles.pillSp : ''} ${dia === i ? styles.pillOn : ''}`}
                    title={d.extra ? `Inclui ${d.sigla} e ${d.extra}` : d.sigla}
                    onClick={() => setDia(dia === i ? null : i)}
                  >{d.label}</button>
                ))}
              </div>
            </div>

            <div className={styles.fg}>
              <label>Mix</label>
              <select value={mix} onChange={e => setMix(e.target.value)}>
                <option value="">Todos</option>
                <option value="ok">Somente ✔ OK</option>
                <option value="nok">Somente ❌ NOK</option>
              </select>
            </div>

            <div className={styles.fg}>
              <label>Operação</label>
              <input
                value={op}
                onChange={e => setOp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ex: Temar, Cemar"
              />
            </div>

            <div className={`${styles.fg} ${styles.fgButtons}`}>
              <button className={styles.btnSearch} onClick={buscar} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
              <button className={styles.btnClear} onClick={limpar}>Limpar</button>
            </div>

          </div>
        </div>

        {/* ── Erro ── */}
        {error && (
          <div className={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Loader ── */}
        {loading && (
          <div className={styles.loader}>
            <div className={styles.spinner} />
            Carregando dados da planilha...
          </div>
        )}

        {/* ── Stats ── */}
        {!loading && hasResult && (
          <div className={styles.stats}>
            <div className={`${styles.statCard} ${styles.statGreen}`}>
              <div className={styles.statL}>HE — clientes</div>
              <div className={styles.statV}>{resHE.length}</div>
              <div className={styles.statS}>Mix OK: {mixOkHE}</div>
            </div>
            <div className={`${styles.statCard} ${styles.statBlue}`}>
              <div className={styles.statL}>CORE — clientes</div>
              <div className={styles.statV}>{resCore.length}</div>
              <div className={styles.statS}>Mix OK: {mixOkCore}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statL}>Total</div>
              <div className={styles.statV}>{total}</div>
              <div className={styles.statS}>HE + CORE</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statL}>Mix OK total</div>
              <div className={styles.statV}>{mixTot}</div>
              <div className={styles.statS}>{total ? Math.round(mixTot / total * 100) : 0}% do total</div>
            </div>
          </div>
        )}

        {/* ── Resultado ── */}
        {!loading && !error && (
          <>
            {hasResult ? (
              <>
                <div className={styles.tabsRow}>
                  <div className={styles.tabs}>
                    <button
                      className={`${styles.tab} ${aba === 'he' ? `${styles.tabOn} ${styles.tabHe}` : ''}`}
                      onClick={() => setAba('he')}
                    >
                      HE Score 5 <span className={`${styles.cnt} ${styles.cntH}`}>{resHE.length}</span>
                    </button>
                    <button
                      className={`${styles.tab} ${aba === 'core' ? styles.tabOn : ''}`}
                      onClick={() => setAba('core')}
                    >
                      CORE Score 5 <span className={`${styles.cnt} ${styles.cntC}`}>{resCore.length}</span>
                    </button>
                  </div>
                  <span className={styles.rowCount}>{currentRows.length} registro{currentRows.length !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.tableCard}>
                  <DataTable rows={currentRows} headers={currentHeaders} />
                </div>
              </>
            ) : (
              !loading && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  {resHE.length === 0 && resCore.length === 0 && heData
                    ? 'Nenhum resultado. Tente outros filtros.'
                    : 'Aplique os filtros e clique em Buscar.'}
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  )
}
