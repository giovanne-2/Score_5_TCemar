'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSheets, DIAS, filtrar, detectarDia } from '@/components/useSheets'
import { DayPills, FG, Select, OkFilter, BtnGhost, DataTable, Card, Loader } from '@/components/UI'
import { FIXED_COLS, GRUPOS_HE, GRUPOS_CORE } from '@/lib/sheets'
import type { Row } from '@/lib/sheets'

const COLS_600_CORE = ['SPT 600','STL 600','COR 600','ORI 600','AP 600','BC 600','SK 600','STE 600','OUTROS 600']
const PLANNER_HIDDEN_COLS = ['OPERAÇÃO','Freq. Visita','Segmento']
const PLANNER_FIXED_COLS = FIXED_COLS.filter(c => !PLANNER_HIDDEN_COLS.includes(c))
const PLANNER_GRUPOS_CORE = Object.fromEntries(
  Object.entries(GRUPOS_CORE).filter(([label]) => !['LNs','ZEROs'].includes(label)),
)

function calcGapInteira(row: Row): string {
  const meta = parseFloat((row['Meta Inteira']||'0').replace(',','.'))
  const soma = COLS_600_CORE.reduce((a,c)=>{ const v=parseInt(row[c]||'0',10); return a+(isNaN(v)?0:v) },0)
  if (isNaN(meta)) return ''
  return (meta - soma).toString()
}

export default function Planejador() {
  const { heData, coreData, loading, error, lastModified, load, reload } = useSheets()
  const [setor,    setSetor]    = useState('')
  const [dia,      setDia]      = useState<number|null>(detectarDia)
  const [mix,      setMix]      = useState('')
  const [op,       setOp]       = useState('')
  const [taskTtc,  setTaskTtc]  = useState('')
  const [taskFat,  setTaskFat]  = useState('')
  const [cupons,   setCupons]   = useState('')
  const [visitaGv, setVisitaGv] = useState('')
  const [base,     setBase]     = useState<'ambas'|'he'|'core'>('ambas')
  const [aba,      setAba]      = useState<'he'|'core'>('he')

  useEffect(()=>{ load() },[load])

  const setores = useMemo(()=>{
    const s=new Set<string>()
    ;[heData,coreData].forEach(d=>d?.rows.forEach(r=>r['Setor']&&s.add(r['Setor'])))
    return Array.from(s).sort((a,b)=>+a-+b)
  },[heData,coreData])

  const operacoes = useMemo(()=>{
    const s=new Set<string>()
    ;[heData,coreData].forEach(d=>d?.rows.forEach(r=>r['OPERAÇÃO']&&s.add(r['OPERAÇÃO'])))
    return Array.from(s).sort()
  },[heData,coreData])

  const resHE   = useMemo(()=>base!=='core'&&heData   ? filtrar(heData.rows,  setor,dia,mix,op,taskTtc,taskFat,cupons,visitaGv):[]
    ,[heData,  setor,dia,mix,op,taskTtc,taskFat,cupons,visitaGv,base])
  const resCore = useMemo(()=>base!=='he'  &&coreData ? filtrar(coreData.rows,setor,dia,mix,op,taskTtc,taskFat,cupons,visitaGv):[]
    ,[coreData,setor,dia,mix,op,taskTtc,taskFat,cupons,visitaGv,base])

  const currentRows    = aba==='he' ? resHE   : resCore
  const currentHeaders = aba==='he' ? (heData?.headers??[]) : (coreData?.headers??[])
  const currentGrupos  = aba==='he' ? GRUPOS_HE : PLANNER_GRUPOS_CORE
  const extraCols      = aba==='core' ? [{ label:'GAP INTEIRA', compute:calcGapInteira }] : []
  const diaLabel = dia!==null ? `${DIAS[dia].sigla}${DIAS[dia].extra?' + '+DIAS[dia].extra:''}` : 'Todos os dias'

  const limpar = ()=>{ setSetor('');setMix('');setOp('');setDia(detectarDia());setBase('ambas');setTaskTtc('');setTaskFat('');setCupons('');setVisitaGv('') }

  const tabStyle=(active:boolean,color='blue'): React.CSSProperties=>({
    padding:'7px 18px',fontSize:13,fontWeight:500,cursor:'pointer',borderRadius:7,
    border:`1px solid ${active?(color==='green'?'rgba(62,207,142,.3)':'rgba(74,143,232,.3)'):'transparent'}`,
    color:active?(color==='green'?'var(--green)':'var(--blue)'):'var(--muted)',
    background:active?(color==='green'?'var(--green-dim)':'var(--blue-dim)'):'transparent', transition:'all .12s',
  })

  return (
    <div style={{ maxWidth:1440,margin:'0 auto',padding:'clamp(1rem,4vw,1.5rem) clamp(.75rem,4vw,2rem)' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem',flexWrap:'wrap',gap:10 }}>
        <div>
          <h2 style={{ fontSize:18,fontWeight:600,color:'var(--text)' }}>Planejador de Visitas</h2>
          <p style={{ fontSize:12,color:'var(--muted)',marginTop:3 }}>Filtro ativo: {diaLabel} — filtragem em tempo real</p>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          {lastModified&&<span style={{ fontSize:11,color:'var(--muted)' }}>Planilha: {lastModified}</span>}
          <button onClick={reload} disabled={loading} style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:6,border:'1px solid var(--border2)',background:'transparent',color:'var(--muted)',fontSize:12,cursor:'pointer' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5M13.5 2.5v3h-3"/></svg>
            Atualizar
          </button>
        </div>
      </div>

      <Card style={{ padding:'1.25rem 1.5rem',marginBottom:'1.25rem' }}>
        <p style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:.8,color:'var(--muted)',marginBottom:14 }}>Filtros</p>
        <div style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end' }}>
          <FG label="Setor">
            <Select value={setor} onChange={e=>setSetor(e.target.value)}>
              <option value="">Todos</option>
              {setores.map(s=><option key={s} value={s}>{s}</option>)}
            </Select>
          </FG>
          <FG label="Dia de visita"><DayPills value={dia} onChange={setDia} /></FG>
          <OkFilter label="Mix"       value={mix}      onChange={setMix}      />
          <OkFilter label="Task Fat." value={taskFat}  onChange={setTaskFat}  />
          <OkFilter label="Task TTC"  value={taskTtc}  onChange={setTaskTtc}  />
          <OkFilter label="Cupons ≥20" value={cupons}  onChange={setCupons}   />
          <OkFilter label="Visita GV" value={visitaGv} onChange={setVisitaGv} />
          <FG label="Operação">
            <Select value={op} onChange={e=>setOp(e.target.value)}>
              <option value="">Todas</option>
              {operacoes.map(o=><option key={o} value={o}>{o}</option>)}
            </Select>
          </FG>
          <FG label="Base">
            <Select value={base} onChange={e=>setBase(e.target.value as typeof base)}>
              <option value="ambas">HE + CORE</option>
              <option value="he">Somente HE</option>
              <option value="core">Somente CORE</option>
            </Select>
          </FG>
          <BtnGhost onClick={limpar}>Limpar</BtnGhost>
        </div>
      </Card>

      {error&&<div style={{ background:'var(--red-dim)',border:'1px solid rgba(242,106,106,.3)',borderRadius:8,padding:'12px 16px',fontSize:13,color:'var(--red)',marginBottom:'1rem' }}>⚠️ {error}</div>}
      {loading ? <Loader text="Carregando planilha..."/> : (
        <>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:10 }}>
            <div style={{ display:'flex',gap:4 }}>
              {(base==='ambas'||base==='he')&&(
                <button style={tabStyle(aba==='he','green')} onClick={()=>setAba('he')}>
                  HE Score 5 <span style={{ display:'inline-flex',fontSize:11,fontWeight:600,padding:'1px 7px',borderRadius:10,marginLeft:7,background:'var(--green-dim)',color:'var(--green)' }}>{resHE.length}</span>
                </button>
              )}
              {(base==='ambas'||base==='core')&&(
                <button style={tabStyle(aba==='core')} onClick={()=>setAba('core')}>
                  CORE Score 5 <span style={{ display:'inline-flex',fontSize:11,fontWeight:600,padding:'1px 7px',borderRadius:10,marginLeft:7,background:'var(--blue-dim)',color:'var(--blue)' }}>{resCore.length}</span>
                </button>
              )}
            </div>
            <span style={{ fontSize:12,color:'var(--muted)' }}>{currentRows.length} registro{currentRows.length!==1?'s':''}</span>
          </div>
          <Card><DataTable rows={currentRows} headers={currentHeaders} fixedCols={PLANNER_FIXED_COLS} grupos={currentGrupos} extraCols={extraCols} hiddenCols={PLANNER_HIDDEN_COLS} groupsAfterCol="Mix OK" groupCellMode={aba==='he' ? 'purchased' : 'missing'}/></Card>
        </>
      )}
    </div>
  )
}
