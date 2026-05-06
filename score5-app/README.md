# Score 5 — Dashboard

Dashboard web para consulta de clientes Score 5 por setor, dia de visita, mix e operação.
Lê dados diretamente do Google Sheets publicado (sem banco de dados).

---

## 🚀 Deploy no Vercel — passo a passo completo

### Passo 1 — Preparar a planilha

1. Abra a planilha no Google Sheets
2. Vá em **Arquivo → Compartilhar → Publicar na web**
3. Selecione **Planilha inteira** e formato **Valores separados por vírgula (.csv)**
4. Clique em **Publicar** → copie a URL gerada
   - Ela tem formato: `https://docs.google.com/spreadsheets/d/e/SEU_ID/pub`
5. Anote também o GID de cada aba:
   - Clique na aba → olhe a URL: `...#gid=XXXXXXX` — esse número é o GID

### Passo 2 — Subir no GitHub

```bash
# Na pasta do projeto:
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/SEU_USUARIO/score5-app.git
git push -u origin main
```

### Passo 3 — Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com o GitHub
2. Clique em **Add New → Project**
3. Selecione o repositório `score5-app`
4. **Antes de clicar em Deploy**, clique em **Environment Variables** e adicione:

| Variável          | Valor                                                          |
|-------------------|----------------------------------------------------------------|
| `SHEETS_BASE_URL` | `https://docs.google.com/spreadsheets/d/e/SEU_ID/pub`         |
| `GID_HE`          | GID da aba HE SCORE 5 (número da URL)                         |
| `GID_CORE`        | GID da aba CORE SCORE 5 (número da URL)                       |

5. Clique em **Deploy** ✅

> **Atenção:** `GID_HE=0` é o padrão da primeira aba. Se a aba HE não for a primeira, substitua pelo GID real.

---

## 💻 Rodar localmente

```bash
npm install
npm run dev
```

Edite o `.env.local` com seus valores reais antes de rodar:

```env
SHEETS_BASE_URL=https://docs.google.com/spreadsheets/d/e/SEU_ID/pub
GID_HE=0
GID_CORE=1179173750
```

Acesse: http://localhost:3000

---

## 🔧 Ajustar colunas da planilha

Edite `src/lib/sheets.ts` — os nomes devem bater **exatamente** com os cabeçalhos da planilha (case-insensitive):

```ts
export const COLS_HE = [
  'OPERAÇÃO', 'SETOR', 'PDV', 'NOME', 'FREQ. VISITA', 'MIX', 'SCORE',
]

export const COLS_CORE = [
  'OPERAÇÃO', 'SETOR', 'PDV', 'NOME', 'FREQ. VISITA', 'MIX', 'SCORE',
]
```

---

## 🗂️ Estrutura do projeto

```
src/
  app/
    api/sheets/route.ts   ← fetch CSV server-side (URL nunca exposta no browser)
    page.tsx              ← dashboard com filtros e tabela
    page.module.css       ← estilos do dashboard
    globals.css           ← variáveis CSS e reset
    layout.tsx            ← layout raiz + fontes
  lib/
    sheets.ts             ← parser CSV + mapeamento de colunas
```

---

## ⚙️ Comportamento de cache

Os dados são revalidados automaticamente a cada **5 minutos**.
Se precisar forçar atualização manual, clique no botão ↺ no canto superior direito do dashboard.
