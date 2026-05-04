import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Score 5 — Dashboard',
  description: 'Consulta de clientes Score 5 por setor e dia de visita',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
