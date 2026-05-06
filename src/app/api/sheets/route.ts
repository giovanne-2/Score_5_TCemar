import { NextResponse } from 'next/server'
import { parseCSV, csvToObjects, COLS_HE, COLS_CORE } from '@/lib/sheets'

const GID_HE = process.env.GID_HE ?? '0'
const GID_CORE = process.env.GID_CORE ?? '1179173750'
const PUBLISHED_BASE =
  process.env.SHEETS_BASE_URL ??
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTN8dzafG13ns6ezQG6sloWgd_TBIGEUwUcaIetWW7UrM-TI2ygDeOGgIfCb-WAFftHD8LoHlEtggSa/pub'
const REVALIDATE_SECONDS = Number(process.env.SHEETS_REVALIDATE_SECONDS ?? 60)

async function fetchSheet(gid: string, forceFresh: boolean) {
  const url = `${PUBLISHED_BASE}?gid=${gid}&single=true&output=csv`
  const res = await fetch(
    url,
    forceFresh ? { cache: 'no-store' } : { next: { revalidate: REVALIDATE_SECONDS } },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status} — gid=${gid}`)
  // O header Date é a hora da resposta HTTP, não a atualização da planilha.
  const lastModified = res.headers.get('last-modified')
  const text = await res.text()
  return { text, lastModified }
}

export async function GET(req: Request) {
  try {
    const forceFresh = new URL(req.url).searchParams.get('refresh') === '1'
    const [rHE, rCore] = await Promise.all([
      fetchSheet(GID_HE, forceFresh),
      fetchSheet(GID_CORE, forceFresh),
    ])

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

    return NextResponse.json(
      { he, core, lastModified: lastModifiedFmt },
      { headers: { 'Cache-Control': `s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=300` } },
    )
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
