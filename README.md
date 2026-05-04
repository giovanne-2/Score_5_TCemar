# Score 5 — Dashboard

App web para consulta de clientes Score 5 por setor, dia de visita, mix e operação.
Lê dados diretamente do Google Sheets publicado.

---

## 🚀 Deploy no Vercel (passo a passo)

### 1. Suba o projeto no GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/SEU_USUARIO/score5-app.git
git push -u origin main
```

### 2. Conecte ao Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com o GitHub
2. Clique em **Add New → Project**
3. Selecione o repositório `score5-app`
4. Clique em **Deploy** — sem configuração extra necessária

### 3. Configure o GID das abas (importante!)

O GID é o número que aparece na URL do Google Sheets quando você clica em cada aba:
```
https://docs.google.com/spreadsheets/d/ID/edit#gid=XXXXXXX
                                                    ↑ esse número
```

No Vercel, vá em **Settings → Environment Variables** e adicione:

| Variável          | Valor         |
|-------------------|---------------|
| `GID_HE`          | gid da aba HE SCORE 5 |
| `GID_CORE`        | gid da aba CORE SCORE 5 |

Ou edite diretamente em `src/app/api/sheets/route.ts`:
```ts
const GID_HE   = '0'    // ← substitua pelo gid real
const GID_CORE = '1'    // ← substitua pelo gid real
```

---

## 💻 Rodar localmente

```bash
npm install
npm run dev
```
Acesse: http://localhost:3000

---

## 📊 Configurar a planilha Google Sheets

A planilha precisa estar **publicada na web**:

1. Abra a planilha → **Arquivo → Compartilhar → Publicar na web**
2. Publique cada aba (`HE SCORE 5` e `CORE SCORE 5`) no formato **CSV**
3. Anote os GIDs de cada aba (veja item 3 acima)

---

## 🔧 Adicionar/remover colunas

Edite `src/lib/sheets.ts`:

```ts
export const COLS_HE = [
  'OPERAÇÃO', 'PDV', 'Setor', 'Freq. Visita', 'Nome',
  // adicione ou remova títulos de coluna aqui
]
```

O sistema busca sempre pelo **título exato da coluna**, então não importa em qual posição ela estiver na planilha.

---

## 🗂️ Estrutura do projeto

```
src/
  app/
    api/sheets/route.ts   ← busca CSV do Google Sheets (server-side)
    page.tsx              ← dashboard principal
    page.module.css       ← estilos
    globals.css           ← variáveis CSS globais
    layout.tsx            ← layout raiz
  lib/
    sheets.ts             ← parser CSV + mapeamento de colunas
```
