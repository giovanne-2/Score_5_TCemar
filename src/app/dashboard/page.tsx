'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSheets, DIAS, filtrar, isOk, cuponsOk } from '@/components/useSheets'
import { DayPills, FG, Select, OkFilter, BtnGhost, Card, StatCard, Loader, DataTable } from '@/components/UI'
import { FIXED_COLS, GRUPOS_HE, GRUPOS_CORE } from '@/lib/sheets'
import type { Row } from '@/lib/sheets'

// ── Bar chart ─────────────────────────────────────────────────────
function BarChart({ data, color }: { data:{label:string;value:number}[]; color:string }) {
  const max = Math.max(...data.map(d=>d.value),1)
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
      {data.map(d=>(
        <div key={d.label} style={{ display:'grid',gridTemplateColumns:'90px 1fr 40px',alignItems:'center',gap:8,fontSize:12 }}>
          <span style={{ color:'var(--muted)',fontSize:11,textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }} title={d.label}>{d.label}</span>
          <div style={{ background:'var(--bg3)',borderRadius:4,height:14,overflow:'hidden' }}>
            <div style={{ width:`${d.value/max*100}%`,height:'100%',background:color,borderRadius:4,transition:'width .4s' }}/>
          </div>
          <span style={{ color:'var(--text)',fontVariantNumeric:'tabular-nums',fontSize:12 }}>{d.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut corrigido ───────────────────────────────────────────────
// Usa strokeDasharray correto: cada arco é proporcional ao total
function Donut({ ok, nok, total, label }: { ok:number; nok:number; total:number; label:string }) {
  const R = 36, SW = 10
  const C = 2 * Math.PI * R  // circunferência total
  const sem = Math.max(0, total - ok - nok)
  const pct = total > 0 ? Math.round(ok/total*100) : 0

  // Cada segmento: comprimento proporcional ao total
  const lenOk  = total > 0 ? (ok/total)  * C : 0
  const lenNok = total > 0 ? (nok/total) * C : 0
  const lenSem = total > 0 ? (sem/total) * C : C

  // Offsets: SVG começa às 3h, queremos começar no topo (−90°)
  // strokeDashoffset positivo = rotação anti-horária
  // Deslocamento em unidades de comprimento = offset no círculo
  const offOk  = C * 0.25                    // topo
  const offNok = offOk  - lenOk              // após ok
  const offSem = offNok - lenNok             // após nok

  const circle = (len: number, off: number, color: string) => (
    len > 0 ? <circle cx={48} cy={48} r={R} fill="none" stroke={color} strokeWidth={SW}
      strokeDasharray={`${len} ${C - len}`}
      strokeDashoffset={off}
      strokeLinecap="butt" /> : null
  )

  return (
    <div style={{ display:'flex',alignItems:'center',gap:20 }}>
      <svg width={96} height={96} viewBox="0 0 96 96" style={{ flexShrink:0 }}>
        {/* fundo */}
        <circle cx={48} cy={48} r={R} fill="none" stroke="var(--bg3)" strokeWidth={SW}/>
        {circle(lenSem, offSem, 'rgba(122,128,153,.25)')}
        {circle(lenNok, offNok, 'var(--red)')}
        {circle(lenOk,  offOk,  'var(--green)')}
        <text x={48} y={53} textAnchor="middle" fill="var(--text)" fontSize={14} fontWeight={700}>{pct}%</text>
      </svg>
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        {[{c:'var(--green)',l:`${label} OK`,v:ok},{c:'var(--red)',l:`${label} NOK`,v:nok},{c:'rgba(122,128,153,.5)',l:'Sem info',v:sem}].map(x=>(
          <div key={x.l} style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:10,height:10,borderRadius:2,background:x.c,flexShrink:0 }}/>
            <span style={{ fontSize:12,color:'var(--muted)',minWidth:80 }}>{x.l}</span>
            <span style={{ fontSize:13,fontWeight:600,color:x.c,marginLeft:'auto' }}>{x.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Overview KPIs ─────────────────────────────────────────────────
function OverviewBar({ rows }: { rows:Row[] }) {
  const total = rows.length || 1
  const items = [
    { label:'Mix OK',     ok:rows.filter(r=>isOk(r['Mix OK']||'')).length,     color:'var(--green)'  },
    { label:'Task Fat.',  ok:rows.filter(r=>isOk(r['Task Fat.']||'')).length,  color:'var(--blue)'   },
    { label:'Task TTC',   ok:rows.filter(r=>isOk(r['Task TTC']||'')).length,   color:'var(--yellow)' },
    { label:'Visita GV',  ok:rows.filter(r=>isOk(r['Visita GV']||'')).length,  color:'#a78bfa'       },
    { label:'Cupons ≥20', ok:rows.filter(r=>cuponsOk(r['Cupons']||'')).length, color:'#fb923c'       },
  ]
  return (
    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10 }}>
      {items.map(it=>{
        const pct=Math.round(it.ok/total*100)
        return (
          <div key={it.label} style={{ background:'var(--bg3)',borderRadius:10,padding:'12px 14px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
              <span style={{ fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.4 }}>{it.label}</span>
              <span style={{ fontSize:13,fontWeight:700,color:it.color }}>{it.ok}<span style={{ fontSize:11,color:'var(--muted)',fontWeight:400 }}>/{rows.length}</span></span>
            </div>
            <div style={{ background:'var(--bg2)',borderRadius:4,height:6,overflow:'hidden' }}>
              <div style={{ width:`${pct}%`,height:'100%',background:it.color,borderRadius:4,transition:'width .4s' }}/>
            </div>
            <div style={{ fontSize:11,color:'var(--muted)',marginTop:5 }}>{pct}% do total</div>
          </div>
        )
      })}
    </div>
  )
}

function topBy(rows:Row[], key:(r:Row)=>boolean, n=10) {
  const cnt:Record<string,number>={}
  rows.filter(key).forEach(r=>{ const s=r['Setor']||'?'; cnt[s]=(cnt[s]||0)+1 })
  return Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([label,value])=>({label,value}))
}
function countByDia(rows:Row[]) {
  const cnt:Record<string,number>={}
  DIAS.forEach(d=>{cnt[d.sigla]=0})
  rows.forEach(r=>DIAS.forEach(d=>{ if((r['Freq. Visita']||'').includes(d.sigla)) cnt[d.sigla]++ }))
  return DIAS.map(d=>({label:d.label,value:cnt[d.sigla]}))
}
function countByOp(rows:Row[]) {
  const cnt:Record<string,number>={}
  rows.forEach(r=>{ const o=r['OPERAÇÃO']; if(o) cnt[o]=(cnt[o]||0)+1 })
  return Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value])=>({label,value}))
}

export default function Dashboard() {
  const { heData, coreData, loading, error, lastModified, load, reload } = useSheets()
  const [setor,    setSetor]    = useState('')
  const [dia,      setDia]      = useState<number|null>(null)
  const [mix,      setMix]      = useState('')
  const [op,       setOp]       = useState('')
  const [taskTtc,  setTaskTtc]  = useState('')
  const [taskFat,  setTaskFat]  = useState('')
  const [cupons,   setCupons]   = useState('')
  const [visitaGv, setVisitaGv] = useState('')
  const [base,     setBase]     = useState<'ambas'|'he'|'core'>('ambas')
  const [tab,      setTab]      = useState<'overview'|'tabela'>('overview')
  const [abaTab,   setAbaTab]   = useState<'he'|'core'>('he')
  const [layer,    setLayer]    = useState<'todos'|'mix'|'taskfat'|'tasktcc'|'visitagv'|'cupons'>('todos')

  useEffect(()=>{load()},[load])

  const setores   = useMemo(()=>{ const s=new Set<string>(); [heData,coreData].forEach(d=>d?.rows.forEach(r=>r['Setor']&&s.add(r['Setor']))); return Array.from(s).sort((a,b)=>+a-+b) },[heData,coreData])
  const operacoes = useMemo(()=>{ const s=new Set<string>(); [heData,coreData].forEach(d=>d?.rows.forEach(r=>r['OPERAÇÃO']&&s.add(r['OPERAÇÃO']))); return Array.from(s).sort() },[heData,coreData])

  const resHE   = useMemo(()=>base!=='core'&&heData   ? filtrar(heData.rows,  setor,dia,mix,op,taskTtc,taskFat,cupons,visitaGv):[]
    ,[heData,  setor,dia,mix,op,taskTtc,taskFat,cupons,visitaGv,base])
  const resCore = useMemo(()=>base!=='he'  &&coreData ? filtrar(coreData.rows,setor,dia,mix,op,taskTtc,taskFat,cupons,visitaGv):[]
    ,[coreData,setor,dia,mix,op,taskTtc,taskFat,cupons,visitaGv,base])
  const allRows = useMemo(()=>[...resHE,...resCore],[resHE,resCore])

  // MIX — contagem correta direto das linhas filtradas
  const mixOk  = allRows.filter(r=>isOk(r['Mix OK']||'')).length
  const mixNok = allRows.filter(r=>{ const v=r['Mix OK']||''; return v.includes('❌')||v==='0' }).length
  // Task Fat.
  const tfOk   = allRows.filter(r=>isOk(r['Task Fat.']||'')).length
  const tfNok  = allRows.filter(r=>{ const v=r['Task Fat.']||''; return v.includes('❌')||v==='0' }).length

  const diaBar    = useMemo(()=>countByDia(allRows),[allRows])
  const opBar     = useMemo(()=>countByOp(allRows),[allRows])
  const topMix    = useMemo(()=>topBy(allRows,r=>isOk(r['Mix OK']||'')),[allRows])
  const topTaskFat= useMemo(()=>topBy(allRows,r=>isOk(r['Task Fat.']||'')),[allRows])

  const limpar = ()=>{ setSetor('');setMix('');setOp('');setDia(null);setBase('ambas');setTaskTtc('');setTaskFat('');setCupons('');setVisitaGv('') }
  const tabStyle=(active:boolean): React.CSSProperties=>({ padding:'7px 16px',fontSize:13,fontWeight:500,cursor:'pointer',borderRadius:7,border:`1px solid ${active?'rgba(74,143,232,.3)':'transparent'}`,color:active?'var(--blue)':'var(--muted)',background:active?'var(--blue-dim)':'transparent',transition:'all .12s' })
  const layerStyle=(v:string): React.CSSProperties=>({ padding:'4px 12px',fontSize:12,borderRadius:20,cursor:'pointer',border:`1px solid ${layer===v?'rgba(74,143,232,.4)':'var(--border2)'}`,background:layer===v?'var(--blue-dim)':'var(--bg3)',color:layer===v?'var(--blue)':'var(--muted)',transition:'all .12s' })

  return (
    <div style={{ maxWidth:1440,margin:'0 auto',padding:'1.5rem 2rem' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem',flexWrap:'wrap',gap:10 }}>
        <div>
          <h2 style={{ fontSize:18,fontWeight:600,color:'var(--text)' }}>Dashboard</h2>
          <p style={{ fontSize:12,color:'var(--muted)',marginTop:3 }}>Visão geral dos dados Score 5</p>
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
          <FG label="Setor"><Select value={setor} onChange={e=>setSetor(e.target.value)}><option value="">Todos</option>{setores.map(s=><option key={s} value={s}>{s}</option>)}</Select></FG>
          <FG label="Dia de visita"><DayPills value={dia} onChange={setDia}/></FG>
          <OkFilter label="Mix"        value={mix}      onChange={setMix}      />
          <OkFilter label="Task Fat."  value={taskFat}  onChange={setTaskFat}  />
          <OkFilter label="Task TTC"   value={taskTtc}  onChange={setTaskTtc}  />
          <OkFilter label="Cupons ≥20" value={cupons}   onChange={setCupons}   />
          <OkFilter label="Visita GV"  value={visitaGv} onChange={setVisitaGv} />
          <FG label="Operação"><Select value={op} onChange={e=>setOp(e.target.value)}><option value="">Todas</option>{operacoes.map(o=><option key={o} value={o}>{o}</option>)}</Select></FG>
          <FG label="Base"><Select value={base} onChange={e=>setBase(e.target.value as typeof base)}><option value="ambas">HE + CORE</option><option value="he">HE</option><option value="core">CORE</option></Select></FG>
          <BtnGhost onClick={limpar}>Limpar</BtnGhost>
        </div>
      </Card>

      {error&&<div style={{ background:'var(--red-dim)',border:'1px solid rgba(242,106,106,.3)',borderRadius:8,padding:'12px 16px',fontSize:13,color:'var(--red)',marginBottom:'1rem' }}>⚠️ {error}</div>}
      {loading?<Loader text="Carregando dados..."/>:(
        <>
          <div style={{ display:'flex',gap:4,marginBottom:'1.25rem' }}>
            <button style={tabStyle(tab==='overview')} onClick={()=>setTab('overview')}>Visão Geral</button>
            <button style={tabStyle(tab==='tabela')}   onClick={()=>setTab('tabela')}>Tabela Detalhada</button>
          </div>

          {tab==='overview'?(
            <>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:'1.25rem' }}>
                <StatCard label="Total" value={allRows.length} sub="HE + CORE"/>
                <StatCard label="HE"    value={resHE.length}   sub={`Mix OK: ${resHE.filter(r=>isOk(r['Mix OK']||'')).length}`}   color="var(--green)"/>
                <StatCard label="CORE"  value={resCore.length} sub={`Mix OK: ${resCore.filter(r=>isOk(r['Mix OK']||'')).length}`}  color="var(--blue)"/>
                <StatCard label="Mix OK"  value={mixOk}  sub={`${allRows.length?Math.round(mixOk/allRows.length*100):0}% do total`}  color="var(--green)"/>
                <StatCard label="Mix NOK" value={mixNok} sub={`${allRows.length?Math.round(mixNok/allRows.length*100):0}% do total`} color="var(--red)"/>
              </div>

              <Card style={{ padding:'1.25rem',marginBottom:'1.25rem' }}>
                <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginBottom:14 }}>Overview de indicadores</p>
                <OverviewBar rows={allRows}/>
              </Card>

              {/* 2 Donuts */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1.25rem' }}>
                <Card style={{ padding:'1.25rem' }}>
                  <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginBottom:16 }}>Mix OK</p>
                  <Donut ok={mixOk} nok={mixNok} total={allRows.length} label="Mix"/>
                </Card>
                <Card style={{ padding:'1.25rem' }}>
                  <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginBottom:16 }}>Task Fat.</p>
                  <Donut ok={tfOk} nok={tfNok} total={allRows.length} label="Task Fat."/>
                </Card>
              </div>

              {/* Barras */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:12,marginBottom:'1.25rem' }}>
                <Card style={{ padding:'1.25rem' }}>
                  <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginBottom:16 }}>Visitas por dia</p>
                  <BarChart data={diaBar} color="var(--blue)"/>
                </Card>
                <Card style={{ padding:'1.25rem' }}>
                  <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginBottom:16 }}>Clientes por operação</p>
                  <BarChart data={opBar} color="var(--yellow)"/>
                </Card>
              </div>

              {/* Top Setores 2 rankings */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1.25rem' }}>
                <Card style={{ padding:'1.25rem' }}>
                  <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginBottom:14 }}>Top setores — Mix ✔</p>
                  <BarChart data={topMix} color="var(--green)"/>
                </Card>
                <Card style={{ padding:'1.25rem' }}>
                  <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginBottom:14 }}>Top setores — Task Fat. ✔</p>
                  <BarChart data={topTaskFat} color="var(--blue)"/>
                </Card>
              </div>

              {/* Camadas */}
              <Card style={{ padding:'1.25rem' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16,flexWrap:'wrap' }}>
                  <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.6,marginRight:4 }}>Análise por camada</p>
                  {(['todos','mix','taskfat','tasktcc','visitagv','cupons'] as const).map(l=>(
                    <button key={l} style={layerStyle(l)} onClick={()=>setLayer(l)}>
                      {{todos:'Todos',mix:'Mix OK',taskfat:'Task Fat.',tasktcc:'Task TTC',visitagv:'Visita GV',cupons:'Cupons ≥20'}[l]}
                    </button>
                  ))}
                </div>
                {(()=>{
                  const f = layer==='todos'?allRows:layer==='mix'?allRows.filter(r=>isOk(r['Mix OK']||'')):layer==='taskfat'?allRows.filter(r=>isOk(r['Task Fat.']||'')):layer==='tasktcc'?allRows.filter(r=>isOk(r['Task TTC']||'')):layer==='visitagv'?allRows.filter(r=>isOk(r['Visita GV']||'')):allRows.filter(r=>cuponsOk(r['Cupons']||''))
                  return (
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12 }}>
                      <div><p style={{ fontSize:11,color:'var(--muted)',marginBottom:10 }}>Por dia de visita</p><BarChart data={countByDia(f)} color="var(--blue)"/></div>
                      <div><p style={{ fontSize:11,color:'var(--muted)',marginBottom:10 }}>Por operação</p><BarChart data={countByOp(f)} color="var(--yellow)"/></div>
                      <div><p style={{ fontSize:11,color:'var(--muted)',marginBottom:10 }}>Top setores ({f.length} reg.)</p><BarChart data={topBy(f,()=>true,10)} color="var(--green)"/></div>
                    </div>
                  )
                })()}
              </Card>
            </>
          ):(
            <>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:10 }}>
                <div style={{ display:'flex',gap:4 }}>
                  <button onClick={()=>setAbaTab('he')} style={{ padding:'7px 18px',fontSize:13,fontWeight:500,cursor:'pointer',borderRadius:7,border:`1px solid ${abaTab==='he'?'rgba(62,207,142,.3)':'transparent'}`,color:abaTab==='he'?'var(--green)':'var(--muted)',background:abaTab==='he'?'var(--green-dim)':'transparent' }}>HE <span style={{ display:'inline-flex',fontSize:11,fontWeight:600,padding:'1px 7px',borderRadius:10,marginLeft:7,background:'var(--green-dim)',color:'var(--green)' }}>{resHE.length}</span></button>
                  <button onClick={()=>setAbaTab('core')} style={{ padding:'7px 18px',fontSize:13,fontWeight:500,cursor:'pointer',borderRadius:7,border:`1px solid ${abaTab==='core'?'rgba(74,143,232,.3)':'transparent'}`,color:abaTab==='core'?'var(--blue)':'var(--muted)',background:abaTab==='core'?'var(--blue-dim)':'transparent' }}>CORE <span style={{ display:'inline-flex',fontSize:11,fontWeight:600,padding:'1px 7px',borderRadius:10,marginLeft:7,background:'var(--blue-dim)',color:'var(--blue)' }}>{resCore.length}</span></button>
                </div>
                <span style={{ fontSize:12,color:'var(--muted)' }}>{(abaTab==='he'?resHE:resCore).length} registros</span>
              </div>
              <Card><DataTable rows={abaTab==='he'?resHE:resCore} headers={abaTab==='he'?(heData?.headers??[]):(coreData?.headers??[])} fixedCols={FIXED_COLS} grupos={abaTab==='he'?GRUPOS_HE:GRUPOS_CORE}/></Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
