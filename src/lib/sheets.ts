// ── Tipos ─────────────────────────────────────────────────────────
export type Row = Record<string, string>

export interface SheetData {
  headers: string[]
  rows: Row[]
}

// ── Parse CSV com suporte a aspas ─────────────────────────────────
export function parseCSV(text: string): string[][] {
  const result: string[][] = []
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    if (!line.trim()) continue
    const cells: string[] = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    cells.push(cur.trim())
    result.push(cells)
  }
  return result
}

// ── Converte linhas em objetos usando títulos das colunas ─────────
export function csvToObjects(
  rows: string[][],
  wantedCols: string[]
): SheetData {
  if (rows.length < 2) return { headers: [], rows: [] }

  // Índice: titulo → posição no array
  const headerRow = rows[0].map(h => h.replace(/^"|"$/g, '').trim())
  const colIndex: Record<string, number> = {}
  headerRow.forEach((h, i) => { colIndex[h] = i })

  // Só mantém as colunas que realmente existem
  const headers = wantedCols.filter(c => colIndex[c] !== undefined)

  const data = rows
    .slice(1)
    .filter(r => r.some(c => c.trim()))
    .map(r => {
      const obj: Row = {}
      headers.forEach(c => { obj[c] = (r[colIndex[c]] ?? '').trim() })
      return obj
    })

  return { headers, rows: data }
}

// ── Colunas desejadas por aba ─────────────────────────────────────
export const COLS_HE = [
  'OPERAÇÃO', 'PDV', 'Setor', 'Freq. Visita', 'Nome', 'Segmento',
  'Meta 600', 'Meta LN', 'Meta LN Zero', 'GAP Fat.', 'Mix OK',
  'SPT 600', 'STL 600', 'COR 600', 'ORI 600',
  'BUD LN', 'COR LN', 'STL LN', 'SPT LN', 'MIC LN', 'CORNT LN', 'STL PG LN', 'Outros LN',
  'ZERO BUD', 'ZERO COR', 'SKUs Faltam',
]

export const COLS_CORE = [
  'OPERAÇÃO', 'PDV', 'Setor', 'Freq. Visita', 'Nome', 'Segmento',
  'Meta RGB', 'Meta Inteira', 'GAP Fat.', 'Mix OK',
  'SPT 600', 'STL 600', 'COR 600', 'ORI 600',
  'BUD LN', 'COR LN', 'STL LN', 'SPT LN', 'MIC LN', 'CORNT LN', 'STL PG LN', 'Outros LN',
  'ZERO BUD', 'ZERO COR', 'SKUs Faltam',
]

// Colunas binárias (0/1 → ✔ ou —)
export const BINARY_COLS = new Set([
  'SPT 600', 'STL 600', 'COR 600', 'ORI 600',
  'BUD LN', 'COR LN', 'STL LN', 'SPT LN', 'MIC LN', 'CORNT LN', 'STL PG LN', 'Outros LN',
  'ZERO BUD', 'ZERO COR',
])
