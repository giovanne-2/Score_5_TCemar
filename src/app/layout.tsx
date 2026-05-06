import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Score 5',
  description: 'Dashboard de clientes Score 5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <div style={{ paddingTop: '56px' }}>{children}</div>
      </body>
    </html>
  )
}
