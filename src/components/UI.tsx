'use client'
import React from 'react'
import { DIAS, isOk, cuponsOk } from './useSheets'
import type { Row } from '@/lib/sheets'
import { fmtMoney, fmtNum } from '@/lib/sheets'

// ── Pills de dia ──────────────────────────────────────────────────
export function DayPills({ value, onChange }: { value:number|null; onChange:(d:number|null)=>void }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {[{ label:'Todos', idx:null as number|null }, ...DIAS.map((d,i)=>({ label:d.label+(d.extra?'*':''), idx:i }))].map(({label,idx}) => {
        const on = value === idx; const sp = idx!==null && !!DIAS[idx]?.extra
        return (
          <button key={String(idx)} onClick={()=>onChange(on?null:idx)} style={{
            padding:'5px 12px',fontSize:12,borderRadius:20,cursor:'pointer',
            border:`1px solid ${on?(sp?'rgba(62,207,142,.4)':'rgba(74,143,232,.4)'):'var(--border2)'}`,
            background:on?(sp?'var(--green-dim)':'var(--blue-dim)'):'var(--bg3)',
            color:on?(sp?'var(--green)':'var(--blue)'):'var(--muted)',
            transition:'all .12s',whiteSpace:'nowrap',
          }}>{label}</button>
        )
      })}
    </div>
  )
}

// ── Filtro OK/NOK reutilizável ────────────────────────────────────
export function OkFilter({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) {
  const inputStyle: React.CSSProperties = {
    height:36,padding:'0 12px',fontSize:13,background:'var(--bg3)',color:'var(--text)',
    border:'1px solid var(--border2)',borderRadius:7,outline:'none',minWidth:120,
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:12, color:'var(--muted)' }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={inputStyle}>
        <option value="">Todos</option>
        <option value="ok">Somente ✔ OK</option>
        <option value="nok">Somente ❌ NOK</option>
      </select>
    </div>
  )
}

const inputBase: React.CSSProperties = {
  height:36,padding:'0 12px',fontSize:13,background:'var(--bg3)',
  color:'var(--text)',border:'1px solid var(--border2)',borderRadius:7,outline:'none',minWidth:120,
}
export function FG({ label, children }: { label:string; children:React.ReactNode }) {
  return <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
    <label style={{ fontSize:12,color:'var(--muted)' }}>{label}</label>{children}
  </div>
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select style={{ ...inputBase,minWidth:130 }} {...props}>{props.children}</select>
}
export function BtnGhost(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button style={{ height:36,padding:'0 16px',fontSize:13,background:'transparent',color:'var(--muted)',border:'1px solid var(--border2)',borderRadius:7,cursor:'pointer' }} {...props} />
}

// ── Badge ─────────────────────────────────────────────────────────
export function MixBadge({ v }: { v:string }) {
  if (isOk(v)) return <span style={{ display:'inline-flex',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,background:'var(--green-dim)',color:'var(--green)' }}>✔</span>
  if (v.includes('❌')||v==='0') return <span style={{ display:'inline-flex',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,background:'var(--red-dim)',color:'var(--red)' }}>✗</span>
  return <span style={{ color:'rgba(122,128,153,.35)' }}>—</span>
}

// ── Célula ────────────────────────────────────────────────────────
export function Cell({ col, value }: { col:string; value:string }) {
  if (['Mix OK','Task TTC','Task Fat.','Visita GV'].includes(col)) return <MixBadge v={value} />
  if (col === 'Cupons') {
    if (!value || value==='0') return <span style={{ color:'rgba(122,128,153,.35)' }}>—</span>
    const ok = cuponsOk(value)
    return <span style={{ display:'inline-flex',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,
      background:ok?'var(--green-dim)':'var(--red-dim)',color:ok?'var(--green)':'var(--red)' }}>{value}</span>
  }
  if (col === 'GAP Fat.') return <span style={{ color:'var(--text)',fontVariantNumeric:'tabular-nums' }}>{fmtMoney(value)}</span>
  if (col === 'GAP INTEIRA') return <span style={{ color:'var(--text)',fontVariantNumeric:'tabular-nums' }}>{fmtNum(value)}</span>
  return <span title={value}>{value||<span style={{ color:'rgba(122,128,153,.35)' }}>—</span>}</span>
}

// ── Coluna unificada ─────────────────────────────────────────────
function GrupoCell({ row, cols }: { row:Row; cols:string[] }) {
  const temDado = cols.some(c => (row[c]??'') !== '')
  if (!temDado) return <span style={{ color:'rgba(122,128,153,.35)' }}>—</span>
  const faltam = cols.filter(c => !isOk(row[c]||'') && (row[c]??'') !== '')
  if (faltam.length === 0)
    return <span style={{ display:'inline-flex',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,background:'var(--green-dim)',color:'var(--green)' }}>✔ Todos</span>
  return (
    <div style={{ display:'flex',flexWrap:'wrap',gap:3 }}>
      {faltam.map(c=>(
        <span key={c} style={{ display:'inline-flex',fontSize:10,fontWeight:600,padding:'1px 6px',borderRadius:8,background:'var(--red-dim)',color:'var(--red)',whiteSpace:'nowrap' }}>
          {c.replace(/ 600$/,'').replace(/ LN$/,'').replace(/^ZERO /,'')}
        </span>
      ))}
    </div>
  )
}

// ── Tabela com colunas fixas + grupos ────────────────────────────
interface TableProps {
  rows: Row[]
  headers: string[]
  fixedCols: string[]
  grupos?: Record<string,string[]>
  extraCols?: { label:string; compute:(row:Row)=>string }[]
  hiddenCols?: string[]
}

const thBase: React.CSSProperties = {
  padding:'8px 10px',textAlign:'left',fontWeight:600,fontSize:11,
  color:'var(--muted)',textTransform:'uppercase',letterSpacing:.4,
  borderBottom:'1px solid var(--border)',background:'var(--bg3)',whiteSpace:'nowrap',
}
const tdBase: React.CSSProperties = {
  padding:'7px 10px',color:'var(--text)',whiteSpace:'nowrap',
  borderBottom:'1px solid var(--border)',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',
}

type SortState = { key:string; dir:'asc'|'desc'; kind:'col'|'group'|'extra' } | null

function sortValue(raw: string): string | number {
  const clean = (raw || '').trim()
  if (!clean) return ''
  const normalized = clean
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:[.,]|$))/g, '')
    .replace(',', '.')
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized)
  return clean.toLocaleLowerCase('pt-BR')
}

function compareValues(a: string | number, b: string | number) {
  if (a === '' && b === '') return 0
  if (a === '') return 1
  if (b === '') return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'pt-BR', { numeric:true, sensitivity:'base' })
}

export function DataTable({ rows, headers, fixedCols=[], grupos={}, extraCols=[], hiddenCols=[] }: TableProps) {
  const [sort, setSort] = React.useState<SortState>(null)
  const hidden = new Set(hiddenCols)
  const inGroup = new Set(Object.values(grupos).flat())
  const visibleFixedCols = fixedCols.filter(h => !hidden.has(h))
  const visibleExtraCols = extraCols.filter(c => !hidden.has(c.label))
  const extraLabels = new Set(visibleExtraCols.map(c => c.label))
  const normalCols = headers.filter(h => !hidden.has(h) && !inGroup.has(h) && !visibleFixedCols.includes(h) && !extraLabels.has(h))

  // Larguras fixas por coluna
  const fixedWidthByCol: Record<string, number> = {
    'OPERAÇÃO': 130,
    'PDV': 82,
    'Setor': 70,
    'Freq. Visita': 100,
    'Nome': 190,
  }
  const fixedWidths = visibleFixedCols.map(h => fixedWidthByCol[h] ?? 120)
  const getSortValue = (row: Row, active: NonNullable<SortState>) => {
    if (active.kind === 'extra') {
      const extra = visibleExtraCols.find(c => c.label === active.key)
      return sortValue(extra ? extra.compute(row) : '')
    }
    if (active.kind === 'group') {
      const cols = grupos[active.key] ?? []
      const missing = cols.filter(c => !isOk(row[c] || '') && (row[c] ?? '') !== '').length
      return missing
    }
    return sortValue(row[active.key] || '')
  }
  const sortedRows = React.useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((a,b) => {
      const result = compareValues(getSortValue(a, sort), getSortValue(b, sort))
      return sort.dir === 'asc' ? result : -result
    })
  }, [rows, sort, grupos, visibleExtraCols])
  const nextSort = (key:string, kind:NonNullable<SortState>['kind']) => {
    setSort(current => {
      if (!current || current.key !== key || current.kind !== kind) return { key, kind, dir:'asc' }
      if (current.dir === 'asc') return { key, kind, dir:'desc' }
      return null
    })
  }
  const SortHeader = ({ label, kind, style }: { label:string; kind:NonNullable<SortState>['kind']; style?:React.CSSProperties }) => {
    const active = sort?.key === label && sort.kind === kind
    return (
      <button
        type="button"
        onClick={() => nextSort(label, kind)}
        title={`Ordenar por ${label}`}
        style={{ all:'unset',display:'inline-flex',alignItems:'center',gap:5,cursor:'pointer',color:active?'var(--accent)':'inherit',...style }}
      >
        <span>{label}</span>
        <span style={{ fontSize:10,color:active?'var(--accent)':'var(--muted)' }}>{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    )
  }

  if (!rows.length) return (
    <div style={{ textAlign:'center',padding:'3rem',color:'var(--muted)',fontSize:13 }}>📭 Nenhum registro com esses filtros.</div>
  )

  return (
    <div style={{ width:'100%',maxWidth:'100%',overflowX:'auto',overflowY:'hidden',WebkitOverflowScrolling:'touch',touchAction:'pan-x' }}>
      <table style={{ width:'max-content',minWidth:'100%',borderCollapse:'collapse',fontSize:12,whiteSpace:'nowrap' }}>
        <thead>
          <tr>
            {visibleFixedCols.map((h,i) => {
              const left = fixedWidths.slice(0,i).reduce((a,b)=>a+b,0)
              return <th key={h} style={{ ...thBase,position:'sticky',left,zIndex:3,minWidth:fixedWidths[i] }}><SortHeader label={h} kind="col" /></th>
            })}
            {normalCols.map(h => <th key={h} style={thBase}><SortHeader label={h} kind="col" /></th>)}
            {Object.entries(grupos).map(([lbl])=><th key={lbl} style={{ ...thBase,minWidth:150 }}><SortHeader label={lbl} kind="group" /></th>)}
            {visibleExtraCols.map(c=><th key={c.label} style={thBase}><SortHeader label={c.label} kind="extra" /></th>)}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row,i)=>(
            <tr key={i}>
              {visibleFixedCols.map((h,fi)=>{
                const left = fixedWidths.slice(0,fi).reduce((a,b)=>a+b,0)
                return <td key={h} style={{ ...tdBase,position:'sticky',left,zIndex:1,background:'var(--bg2)',minWidth:fixedWidths[fi] }}>
                  <Cell col={h} value={row[h]||''} />
                </td>
              })}
              {normalCols.map(h=><td key={h} style={tdBase}><Cell col={h} value={row[h]||''} /></td>)}
              {Object.entries(grupos).map(([lbl,cols])=>(
                <td key={lbl} style={{ ...tdBase,minWidth:150 }}><GrupoCell row={row} cols={cols} /></td>
              ))}
              {visibleExtraCols.map(c=><td key={c.label} style={tdBase}><Cell col={c.label} value={c.compute(row)} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,...style }}>{children}</div>
}
export function StatCard({ label,value,sub,color }: { label:string;value:string|number;sub?:string;color?:string }) {
  return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px' }}>
      <div style={{ fontSize:11,textTransform:'uppercase',letterSpacing:.5,color:'var(--muted)',marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26,fontWeight:700,color:color||'var(--text)',lineHeight:1 }}>{value}</div>
      {sub&&<div style={{ fontSize:11,color:'var(--muted)',marginTop:4 }}>{sub}</div>}
    </div>
  )
}
export function Loader({ text='Carregando...' }: { text?:string }) {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'3rem',color:'var(--muted)',fontSize:13 }}>
      <div style={{ width:18,height:18,borderRadius:'50%',border:'2px solid var(--border2)',borderTopColor:'var(--blue)',animation:'spin .7s linear infinite' }}/>
      {text}<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
