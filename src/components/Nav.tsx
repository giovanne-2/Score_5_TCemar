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
    <header style={{ position:'fixed',top:0,left:0,right:0,height:56,zIndex:100,background:'var(--bg2)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 1.5rem',gap:24 }}>
      <span style={{ fontWeight:700,fontSize:15,color:'var(--blue)',letterSpacing:'-0.5px',marginRight:8 }}>S5</span>
      {tabs.map(t=>{
        const on = path===t.href
        return (
          <Link key={t.href} href={t.href} style={{ fontSize:13,fontWeight:500,padding:'6px 14px',borderRadius:7,textDecoration:'none',transition:'all .15s',color:on?'var(--blue)':'var(--muted)',background:on?'var(--blue-dim)':'transparent',border:`1px solid ${on?'rgba(74,143,232,.3)':'transparent'}` }}>{t.label}</Link>
        )
      })}
    </header>
  )
}
