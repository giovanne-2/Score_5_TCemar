import { NextResponse } from 'next/server'
import { parseCSV, COLS_HE, COLS_CORE, type SheetType } from '@/lib/sheets'

// ✅ Fix 2: revalidação a cada 5 minutos em vez de cache infinito
export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sheet = (searchParams.get('sheet') ?? 'HE').toUpperCase() as SheetType

  // ✅ Fix 1: validação de variáveis de ambiente com mensagem clara
  const BASE_URL = process.env.SHEETS_BASE_URL
  if (!BASE_URL) {
    return NextResponse.json(
      {
        error:
          'Variável SHEETS_BASE_URL não configurada. ' +
          'Adicione-a em Settings → Environment Variables no Vercel.',
      },
      { status: 500 }
    )
  }

  const gidKey = sheet === 'CORE' ? 'GID_CORE' : 'GID_HE'
  const gid    = sheet === 'CORE' ? process.env.GID_CORE : process.env.GID_HE

  if (!gid || gid === '0') {
    return NextResponse.json(
      {
        error:
          `Variável ${gidKey} não configurada ou inválida (valor "0" é placeholder). ` +
          'Adicione o GID real da aba no Vercel.',
      },
      { status: 500 }
    )
  }

  const url = `${BASE_URL}?gid=${gid}&single=true&output=csv`

  // ✅ Fix 3: tratamento de erro com mensagem amigável
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Google Sheets retornou ${res.status}. Verifique se a planilha está publicada na web (Arquivo → Publicar na web).`,
        },
        { status: 502 }
      )
    }

    const csv  = await res.text()
    const cols = sheet === 'CORE' ? COLS_CORE : COLS_HE
    const data = parseCSV(csv, cols)

    return NextResponse.json({ data, sheet, total: data.length })
  } catch (err) {
    console.error('[Score5] Fetch error:', err)
    return NextResponse.json(
      {
        error:
          'Não foi possível conectar à planilha. ' +
          'Verifique sua conexão e se o Google Sheets está publicado.',
      },
      { status: 503 }
    )
  }
}
