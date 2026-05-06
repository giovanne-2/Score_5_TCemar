import { NextResponse } from 'next/server'
import { parseCSV, csvToObjects, COLS_HE, COLS_CORE, PUBLISHED_BASE, GID_HE, GID_CORE } from '@/lib/sheets'

async function fetchSheet(gid: string) {
  const url = `${PUBLISHED_BASE}?gid=${gid}&single=true&output=csv`
  const res = await fetch(url, { cache: 'no-store' }) // sempre fresco
  if (!res.ok) throw new Error(`HTTP ${res.status} — gid=${gid}`)
  // Captura header Last-Modified do Google
  const lastModified = res.headers.get('last-modified') ?? res.headers.get('date') ?? null
  const text = await res.text()
  return { text, lastModified }
}

export async function GET() {
  try {
    const [rHE, rCore] = await Promise.all([fetchSheet(GID_HE), fetchSheet(GID_CORE)])

    const he   = csvToObjects(parseCSV(rHE.text),   COLS_HE)
    const core = csvToObjects(parseCSV(rCore.text),  COLS_CORE)

    // Última atualização: usa o mais recente dos dois
    const toMs = (s: string|null) => s ? new Date(s).getTime() : 0
    const lastModified = toMs(rHE.lastModified) >= toMs(rCore.lastModified)
      ? rHE.lastModified : rCore.lastModified

    // Formata para horário de Brasília
    let lastModifiedFmt: string | null = null
    if (lastModified) {
      try {
        lastModifiedFmt = new Date(lastModified).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day:'2-digit', month:'2-digit', year:'numeric',
          hour:'2-digit', minute:'2-digit'
        })
      } catch { lastModifiedFmt = lastModified }
    }

    return NextResponse.json({ he, core, lastModified: lastModifiedFmt })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
