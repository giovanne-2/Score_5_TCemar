'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSheets, isOk, cuponsOk } from '@/components/useSheets'
import { Card, Loader } from '@/components/UI'
import type { Row } from '@/lib/sheets'

type Dim = 'setor' | 'operacao'
type KPI = 'mix' | 'taskFat' | 'taskTtc' | 'visitaGv' | 'cupons'

const KPIS: { key:KPI; label:string; color:string; check:(r:Row)=>boolean }[] = [
  { key:'mix',      label:'Mix OK',    color:'var(--green)',  check: r=>isOk(r['Mix OK']||'')       },
  { key:'taskFat',  label:'Task Fat.', color:'var(--blue)',   check: r=>isOk(r['Task Fat.']||'')    },
  { key:'taskTtc',  label:'Task TTC',  color:'var(--yellow)', check: r=>isOk(r['Task TTC']||'')     },
  { key:'visitaGv', label:'Visita GV', color:'#a78bfa',       check: r=>isOk(r['Visita GV']||'')    },
  { key:'cupons',   label:'Cupons ≥20',color:'#fb923c',       check: r=>cuponsOk(r['Cupons']||'')   },
]

function pct(ok:number, total:number) {
  return total > 0 ? Math.round(ok/total*100) : 0
}

function PctBar({ value, color }: { value:number; color:string }) {
  const bg = value>=70?'var(--green-dim)':value>=40?'rgba(245,166,35,.15)':'var(--red-dim)'
  const fg = value>=70?'var(--green)':value>=40?'var(--yellow)':'var(--red)'
  return (
    <div style={{ display:'flex',alignItems:'center',gap:6 }}>
      <div style={{ flex:1,background:'var(--bg3)',borderRadius:4,height:8,overflow:'hidden',minWidth:60 }}>
        <div style={{ width:`${value}%`,height:'100%',background:fg,borderRadius:4,transition:'width .4s' }}/>
      </div>
      <span style={{ fontSize:11,fontWeight:600,color:fg,minWidth:32,textAlign:'right' }}>{value}%</span>
    </div>
  )
}

function ResumoTabela({ rows, dimKey }: { rows:Row[]; dimKey:'Setor'|'OPERAÇÃO' }) {
  // Agrupa por dimensão
  const grupos = useMemo(()=>{
    const map = new Map<string, Row[]>()
    rows.forEach(r => {
      const k = r[dimKey] || '(vazio)'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(r)
    })
    // Ordena por nome/número
    return Array.from(map.entries()).sort((a,b)=>{
      const na=+a[0], nb=+b[0]
      if (!isNaN(na)&&!isNaN(nb)) return na-nb
      return a[0].localeCompare(b[0])
    })
  }, [rows, dimKey])

  if (!grupos.length) return <div style={{ textAlign:'center',padding:'3rem',color:'var(--muted)',fontSize:13 }}>📭 Sem dados.</div>

  const thS: React.CSSProperties = {
    padding:'8px 12px',textAlign:'left',fontWeight:600,fontSize:11,color:'var(--muted)',
    textTransform:'uppercase',letterSpacing:.4,borderBottom:'1px solid var(--border)',
    background:'var(--bg3)',whiteSpace:'nowrap',
  }
  const tdS: React.CSSProperties = {
    padding:'8px 12px',borderBottom:'1px solid var(--border)',verticalAlign:'middle',
  }

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
        <thead>
          <tr>
            <th style={{ ...thS,minWidth:80 }}>{dimKey==='Setor'?'Setor':'Operação'}</th>
            <th style={{ ...thS,minWidth:60 }}>Total</th>
            {KPIS.map(k=>(
              <th key={k.key} style={{ ...thS,minWidth:160 }}>{k.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.map(([dim, rws])=>(
            <tr key={dim} style={{ borderBottom:'1px solid var(--border)' }}>
              <td style={{ ...tdS,fontWeight:600,color:'var(--text)' }}>{dim}</td>
              <td style={{ ...tdS,color:'var(--muted)' }}>{rws.length}</td>
              {KPIS.map(k=>{
                const ok=rws.filter(r=>k.check(r)).length
                const p=pct(ok,rws.length)
                return (
                  <td key={k.key} style={{ ...tdS,minWidth:160 }}>
                    <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                      <div style={{ display:'flex',justifyContent:'space-between',fontSize:11 }}>
                        <span style={{ color:'var(--muted)' }}>{ok}/{rws.length}</span>
                      </div>
                      <PctBar value={p} color={k.color}/>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Resumo() {
  const { heData, coreData, loading, error, lastModified, load, reload } = useSheets()
  const [dim,  setDim]  = useState<Dim>('setor')
  const [base, setBase] = useState<'ambas'|'he'|'core'>('ambas')

  useEffect(()=>{load()},[load])

  const allRows = useMemo(()=>{
    const he   = base!=='core' ? (heData?.rows  ??[]) : []
    const core = base!=='he'   ? (coreData?.rows??[]) : []
    return [...he,...core]
  },[heData,coreData,base])

  const dimKey: 'Setor'|'OPERAÇÃO' = dim==='setor' ? 'Setor' : 'OPERAÇÃO'

  // Totais gerais
  const totais = useMemo(()=>
    KPIS.map(k=>({ ...k, ok:allRows.filter(r=>k.check(r)).length }))
  ,[allRows])

  const inputStyle: React.CSSProperties = { height:34,padding:'0 10px',fontSize:13,background:'var(--bg3)',color:'var(--text)',border:'1px solid var(--border2)',borderRadius:7,outline:'none' }

  return (
    <div style={{ maxWidth:1440,margin:'0 auto',padding:'1.5rem 2rem' }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem',flexWrap:'wrap',gap:10 }}>
        <div>
          <h2 style={{ fontSize:18,fontWeight:600,color:'var(--text)' }}>Resumo por {dim==='setor'?'Vendedor (Setor)':'Operação'}</h2>
          <p style={{ fontSize:12,color:'var(--muted)',marginTop:3 }}>KPIs consolidados — Mix, Task Fat., Task TTC, Visita GV e Cupons</p>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          {lastModified&&<span style={{ fontSize:11,color:'var(--muted)' }}>Planilha: {lastModified}</span>}
          <button onClick={reload} disabled={loading} style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:6,border:'1px solid var(--border2)',background:'transparent',color:'var(--muted)',fontSize:12,cursor:'pointer' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5M13.5 2.5v3h-3"/></svg>
            Atualizar
          </button>
        </div>
      </div>

      {/* Controles */}
      <Card style={{ padding:'1rem 1.25rem',marginBottom:'1.25rem' }}>
        <div style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end' }}>
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <label style={{ fontSize:12,color:'var(--muted)' }}>Agrupar por</label>
            <select value={dim} onChange={e=>setDim(e.target.value as Dim)} style={inputStyle}>
              <option value="setor">Vendedor (Setor)</option>
              <option value="operacao">Operação</option>
            </select>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <label style={{ fontSize:12,color:'var(--muted)' }}>Base</label>
            <select value={base} onChange={e=>setBase(e.target.value as typeof base)} style={inputStyle}>
              <option value="ambas">HE + CORE</option>
              <option value="he">Somente HE</option>
              <option value="core">Somente CORE</option>
            </select>
          </div>
        </div>
      </Card>

      {error&&<div style={{ background:'var(--red-dim)',border:'1px solid rgba(242,106,106,.3)',borderRadius:8,padding:'12px 16px',fontSize:13,color:'var(--red)',marginBottom:'1rem' }}>⚠️ {error}</div>}
      {loading?<Loader text="Carregando..."/>:(
        <>
          {/* Totais gerais */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:'1.25rem' }}>
            <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px' }}>
              <div style={{ fontSize:11,textTransform:'uppercase',letterSpacing:.5,color:'var(--muted)',marginBottom:6 }}>Total clientes</div>
              <div style={{ fontSize:26,fontWeight:700,color:'var(--text)',lineHeight:1 }}>{allRows.length}</div>
            </div>
            {totais.map(t=>(
              <div key={t.key} style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px' }}>
                <div style={{ fontSize:11,textTransform:'uppercase',letterSpacing:.5,color:'var(--muted)',marginBottom:6 }}>{t.label}</div>
                <div style={{ fontSize:26,fontWeight:700,color:t.color,lineHeight:1 }}>{t.ok}</div>
                <div style={{ marginTop:8 }}><PctBar value={pct(t.ok,allRows.length)} color={t.color}/></div>
              </div>
            ))}
          </div>

          {/* Tabela de resumo */}
          <Card>
            <ResumoTabela rows={allRows} dimKey={dimKey}/>
          </Card>
        </>
      )}
    </div>
  )
}
