export type Row = Record<string, string>
export interface SheetData { headers: string[]; rows: Row[]; lastModified?: string }

export const FIXED_COLS = ['OPERAÇÃO','PDV','Setor','Freq. Visita','Nome']

// ─────────────────────────────────────────────────────────────────
//  ORDEM DAS COLUNAS — HE
//  Fixas | Info | GAP Fat. | Mix OK | 600s* | LNs* | ZEROs* | SKUs Faltam | Task Fat. | Task TTC | Cupons | Visita GV
// ─────────────────────────────────────────────────────────────────
export const COLS_HE: string[] = [
  ...FIXED_COLS,
  'Segmento','Meta 600','Meta LN','Meta LN Zero',
  'GAP Fat.','Mix OK',
  // grupos (renderizados unificados)
  'SPT 600','STL 600','COR 600','ORI 600',
  'BUD LN','COR LN','STL LN','SPT LN','MIC LN','CORNT LN','STL PG LN','Outros LN',
  'ZERO BUD','ZERO COR',
  'SKUs Faltam',
  'Task Fat.','Task TTC',
  'Cupons','Visita GV',
]

// ─────────────────────────────────────────────────────────────────
//  ORDEM DAS COLUNAS — CORE
//  Fixas | Info | GAP Fat. | Mix OK | 600s* | OUTROS 600 | GAP INTEIRA | LNs* | ZEROs* | SKUs Faltam | Task Fat. | Task TTC | Cupons | Visita GV
// ─────────────────────────────────────────────────────────────────
export const COLS_CORE: string[] = [
  ...FIXED_COLS,
  'Segmento','Meta RGB','Meta Inteira',
  'GAP Fat.','Mix OK',
  // grupos + extra
  'SPT 600','STL 600','COR 600','ORI 600','AP 600','BC 600','SK 600','STE 600',
  'OUTROS 600','GAP INTEIRA',
  'BUD LN','COR LN','STL LN','SPT LN','MIC LN','CORNT LN','STL PG LN','Outros LN',
  'ZERO BUD','ZERO COR',
  'SKUs Faltam',
  'Task Fat.','Task TTC',
  'Cupons','Visita GV',
]

export const BINARY_COLS = new Set([
  'SPT 600','STL 600','COR 600','ORI 600','AP 600','BC 600','SK 600','STE 600',
  'BUD LN','COR LN','STL LN','SPT LN','MIC LN','CORNT LN','STL PG LN',
  'ZERO BUD','ZERO COR',
  'Mix OK','Task TTC','Task Fat.','Visita GV',
])

export const GRUPOS_HE: Record<string,string[]> = {
  '600s':  ['SPT 600','STL 600','COR 600','ORI 600'],
  'LNs':   ['BUD LN','COR LN','STL LN','SPT LN','MIC LN','CORNT LN','STL PG LN'],
  'ZEROs': ['ZERO BUD','ZERO COR'],
}
export const GRUPOS_CORE: Record<string,string[]> = {
  '600s':  ['SPT 600','STL 600','COR 600','ORI 600','AP 600','BC 600','SK 600','STE 600'],
  'LNs':   ['BUD LN','COR LN','STL LN','SPT LN','MIC LN','CORNT LN','STL PG LN'],
  'ZEROs': ['ZERO BUD','ZERO COR'],
}

// ─────────────────────────────────────────────────────────────────
//  FORMATAÇÃO MONETÁRIA  — suporta todos os formatos do Sheets CSV
//  "R$ 3.381"  "-R$ 1.742"  "3381"  "-1742"  "3.381,00"  "########"
// ─────────────────────────────────────────────────────────────────
export function fmtMoney(raw: string): string {
  if (!raw || raw.trim() === '' || raw === '########') return '—'
  let s = raw.trim().replace(/R\$\s*/g, '').replace(/\s/g,'')
  // pt-BR: "3.381,50" → remove pontos de milhar, troca vírgula por ponto
  if (/^-?[\d.]+,\d+$/.test(s)) {
    s = s.replace(/\./g,'').replace(',','.')
  } else {
    // Remove pontos de milhar (3 dígitos após ponto)
    s = s.replace(/\.(?=\d{3}(?:[.,]|$))/g,'')
  }
  const n = parseFloat(s)
  if (isNaN(n)) return raw
  return new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL', maximumFractionDigits:0 }).format(n)
}

// Formata número simples (GAP INTEIRA)
export function fmtNum(raw: string): string {
  if (!raw || raw.trim() === '') return '—'
  const n = parseFloat(raw.replace(',','.'))
  if (isNaN(n)) return raw
  return new Intl.NumberFormat('pt-BR',{ maximumFractionDigits:1 }).format(n)
}

// ── Parse CSV ─────────────────────────────────────────────────────
export function parseCSV(txt: string): string[][] {
  const rows: string[][] = []
  let cells: string[] = []
  let cur = ''
  let inQ = false

  const pushCell = () => {
    cells.push(cur.trim())
    cur = ''
  }

  const pushRow = () => {
    if (cells.some(c => c.trim()) || cur.trim()) {
      pushCell()
      rows.push(cells)
    }
    cells = []
  }

  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i]
    const next = txt[i + 1]

    if (ch === '"') {
      if (inQ && next === '"') {
        cur += '"'
        i++
      } else {
        inQ = !inQ
      }
      continue
    }
    if (ch === ',' && !inQ) {
      pushCell()
      continue
    }
    if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && next === '\n') i++
      pushRow()
      continue
    }
    cur += ch
  }
  pushRow()

  return rows
}

// ── CSV → objetos por título ──────────────────────────────────────
export function csvToObjects(rows: string[][], wanted: string[]): SheetData {
  if (rows.length < 2) return { headers: [], rows: [] }
  const hdr = rows[0].map(h => h.replace(/^"|"$/g,'').trim())
  const idx: Record<string,number> = {}
  hdr.forEach((h,i) => { idx[h] = i })
  const headers = wanted.filter(c => idx[c] !== undefined || c === 'GAP INTEIRA')
  const data = rows.slice(1)
    .filter(r => r.some(c => c.trim()))
    .map(r => {
      const obj: Row = {}
      headers.forEach(c => { obj[c] = c === 'GAP INTEIRA' ? '' : (r[idx[c]] ?? '').trim() })
      return obj
    })
  return { headers, rows: data }
}
