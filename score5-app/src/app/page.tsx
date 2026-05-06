'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import type { SheetRow, SheetType } from '@/lib/sheets'
import styles from './page.module.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uniq(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))].sort()
}

// ─── Ícones SVG inline ────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
)
const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Page() {
  const [sheet, setSheet]     = useState<SheetType>('HE')
  const [rows, setRows]       = useState<SheetRow[]>([])
  const [cols, setCols]       = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Filtros
  const [search, setSearch]   = useState('')
  const [fSetor, setFSetor]   = useState('')
  const [fOp, setFOp]         = useState('')
  const [fFreq, setFFreq]     = useState('')

  // ── Fetch de dados ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (s: SheetType) => {
    setLoading(true)
    setError(null)
    setRows([])

    try {
      const res  = await fetch(`/api/sheets?sheet=${s}`)
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error ?? 'Erro desconhecido')
        return
      }

      setRows(json.data)
      setCols(json.data.length > 0 ? Object.keys(json.data[0]) : [])
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch {
      setError('Falha na requisição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(sheet)
    setSearch(''); setFSetor(''); setFOp(''); setFFreq('')
  }, [sheet, fetchData])

  // ── Opções de filtro ────────────────────────────────────────────────────────
  const setores = useMemo(() => uniq(rows.map((r) => r['SETOR'] ?? '')), [rows])
  const ops     = useMemo(() => uniq(rows.map((r) => r['OPERAÇÃO'] ?? '')), [rows])
  const freqs   = useMemo(() => uniq(rows.map((r) => r['FREQ. VISITA'] ?? '')), [rows])

  // ── Linhas filtradas ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      if (fSetor && r['SETOR']       !== fSetor) return false
      if (fOp    && r['OPERAÇÃO']    !== fOp)    return false
      if (fFreq  && r['FREQ. VISITA'] !== fFreq) return false
      if (q && !Object.values(r).some((v) => v.toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, search, fSetor, fOp, fFreq])

  const hasFilters = !!(search || fSetor || fOp || fFreq)

  return (
    <div className={styles.shell}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>SCORE 5</span>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <div className={styles.headerRight}>
          {lastUpdate && (
            <span className={styles.updateTag}>
              Atualizado às {lastUpdate}
            </span>
          )}
          <button
            className={styles.refreshBtn}
            onClick={() => fetchData(sheet)}
            disabled={loading}
            title="Recarregar dados"
          >
            <IconRefresh />
          </button>
        </div>
      </header>

      {/* ── Tabs HE / CORE ────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        {(['HE', 'CORE'] as SheetType[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${sheet === t ? styles.tabActive : ''}`}
            onClick={() => setSheet(t)}
          >
            {t} SCORE 5
          </button>
        ))}
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <section className={styles.filters}>
        <div className={styles.searchWrap}>
          <IconSearch />
          <input
            className={styles.searchInput}
            placeholder="Buscar PDV, nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          label="Setor"
          value={fSetor}
          onChange={setFSetor}
          options={setores}
          placeholder="Todos"
        />
        <Select
          label="Operação"
          value={fOp}
          onChange={setFOp}
          options={ops}
          placeholder="Todas"
        />
        <Select
          label="Freq. Visita"
          value={fFreq}
          onChange={setFFreq}
          options={freqs}
          placeholder="Todas"
        />

        {hasFilters && (
          <button
            className={styles.clearBtn}
            onClick={() => { setSearch(''); setFSetor(''); setFOp(''); setFFreq('') }}
          >
            Limpar filtros
          </button>
        )}
      </section>

      {/* ── Estado: carregando ────────────────────────────────────────────── */}
      {loading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Carregando planilha…</p>
        </div>
      )}

      {/* ── Estado: erro ──────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className={styles.errorBox}>
          <IconWarning />
          <div>
            <strong>Erro ao carregar dados</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ── Tabela ────────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          <div className={styles.tableWrap}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                Nenhum cliente encontrado com esses filtros.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    {cols.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i}>
                      {cols.map((col) => (
                        <td key={col} data-col={col}>
                          {col === 'SCORE' ? (
                            <span className={styles.scoreBadge}>{row[col]}</span>
                          ) : (
                            row[col] || <span className={styles.nullVal}>—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <footer className={styles.footer}>
            Exibindo <strong>{filtered.length}</strong> de{' '}
            <strong>{rows.length}</strong> clientes — aba{' '}
            <strong>{sheet} SCORE 5</strong>
          </footer>
        </>
      )}
    </div>
  )
}

// ─── Select reutilizável ──────────────────────────────────────────────────────
function Select({
  label, value, onChange, options, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  return (
    <div className={styles.selectWrap}>
      <label className={styles.selectLabel}>{label}</label>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
