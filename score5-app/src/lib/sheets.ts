// ─── Colunas esperadas em cada aba ───────────────────────────────────────────
// Ajuste os nomes para bater EXATAMENTE com os cabeçalhos da planilha
export const COLS_HE = [
  'OPERAÇÃO',
  'SETOR',
  'PDV',
  'NOME',
  'FREQ. VISITA',
  'MIX',
  'SCORE',
] as const

export const COLS_CORE = [
  'OPERAÇÃO',
  'SETOR',
  'PDV',
  'NOME',
  'FREQ. VISITA',
  'MIX',
  'SCORE',
] as const

export type ColsHE   = (typeof COLS_HE)[number]
export type ColsCORE = (typeof COLS_CORE)[number]
export type SheetRow = Record<string, string>
export type SheetType = 'HE' | 'CORE'

// ─── Parser CSV robusto (lida com vírgulas dentro de aspas) ──────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

export function parseCSV(
  csvText: string,
  cols: readonly string[]
): SheetRow[] {
  const lines = csvText.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const rawHeaders = parseCSVLine(lines[0]).map((h) =>
    h.toUpperCase().trim()
  )

  return lines
    .slice(1)
    .map((line) => {
      const values = parseCSVLine(line)
      const row: SheetRow = {}

      for (const col of cols) {
        const idx = rawHeaders.indexOf(col.toUpperCase().trim())
        row[col] = idx >= 0 ? (values[idx] ?? '').trim() : ''
      }

      return row
    })
    .filter((row) => Object.values(row).some((v) => v !== ''))
}
