import { NextResponse } from 'next/server'
import { parseCSV, csvToObjects, COLS_HE, COLS_CORE } from '@/lib/sheets'

// IDs das abas publicadas — atualize se mudar a planilha
// Para buscar o gid: abra a aba no Google Sheets, a URL mostra #gid=XXXXXXX
const PUBLISHED_BASE = process.env.SHEETS_CSV_BASE_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTN8dzafG13ns6ezQG6sloWgd_TBIGEUwUcaIetWW7UrM-TI2ygDeOGgIfCb-WAFftHD8LoHlEtggSa/pub'

// gid de cada aba (veja na URL do Google Sheets ao clicar na aba)
const GID_HE   = process.env.GID_HE   || '0'    // ← ajuste se necessário
const GID_CORE = process.env.GID_CORE  || '1'    // ← ajuste se necessário

async function fetchSheet(gid: string): Promise<string> {
  const url = `${PUBLISHED_BASE}?gid=${gid}&single=true&output=csv`
  const res = await fetch(url, { next: { revalidate: 300 } }) // cache 5 min
  if (!res.ok) throw new Error(`Erro ao buscar aba gid=${gid}: HTTP ${res.status}`)
  return res.text()
}

export async function GET() {
  try {
    const [csvHE, csvCore] = await Promise.all([
      fetchSheet(GID_HE),
      fetchSheet(GID_CORE),
    ])

    const he   = csvToObjects(parseCSV(csvHE),   COLS_HE)
    const core = csvToObjects(parseCSV(csvCore),  COLS_CORE)

    return NextResponse.json({ he, core })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
