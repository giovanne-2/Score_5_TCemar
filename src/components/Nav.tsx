'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const path = usePathname()
  const tabs = [
    { href:'/',          label:'📋  Planejador' },
    { href:'/dashboard', label:'📊  Dashboard'  },
    { href:'/resumo',    label:'📈  Resumo'      },
  ]
  return (
    <header style={{ position:'fixed',top:0,left:0,right:0,height:56,zIndex:100,background:'var(--bg2)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 clamp(12px,4vw,24px)',gap:12,overflowX:'auto',WebkitOverflowScrolling:'touch' }}>
      <span style={{ fontWeight:800,fontSize:15,color:'var(--accent)',letterSpacing:'-0.5px',marginRight:2,flex:'0 0 auto' }}>S5</span>
      {tabs.map(t=>{
        const on = path===t.href
        return (
          <Link key={t.href} href={t.href} style={{ fontSize:13,fontWeight:600,padding:'7px 13px',borderRadius:12,textDecoration:'none',transition:'all .15s',whiteSpace:'nowrap',flex:'0 0 auto',color:on?'var(--accent)':'var(--muted)',background:on?'var(--accent-dim)':'transparent',border:`1px solid ${on?'rgba(255,79,31,.25)':'transparent'}` }}>{t.label}</Link>
        )
      })}
    </header>
  )
}
