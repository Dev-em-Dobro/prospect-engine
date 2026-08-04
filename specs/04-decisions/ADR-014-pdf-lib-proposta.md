# ADR-014 — `pdf-lib` para export de Proposta (F022)

## Status
Aceito — 2026-08-03.

## Contexto
A [F022](../02-features/F022-proposta-persistida-pdf-pipeline.md) precisa de
**download `.pdf`** da Proposta (texto + faixa de preço). Hoje só existe texto
plano copiável ([F012](../02-features/F012-gerador-de-proposta.md)).

Constraints do repo: **sem nova lib sem ADR**; geração síncrona (sem workers);
rodar em Server Action / Route Handler Next 15.

## Decisão
Usar **[`pdf-lib`](https://pdf-lib.js.org/)** para montar um PDF de texto simples
no servidor.

- API pequena, tipada, sem browser obrigatório.
- Suficiente para prosa + headings (sem layout complexo de marketing).
- Sem Chromium/Puppeteer (peso e cold start ruins na Vercel).

## Alternativas consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| **A `pdf-lib`** | Leve, server-side, TypeScript | Layout manual (linhas/y) |
| B `@react-pdf/renderer` | JSX familiar | Bundle maior, API mais pesada pro MVP |
| C Puppeteer/Playwright print HTML | Fidelity visual | Workers/binários — fora do ADR-002 |
| D Só `window.print()` | Zero lib | UX frágil no mobile; sem arquivo `.pdf` estável |

## Consequências
- `package.json` ganha `pdf-lib`.
- Lógica de layout em `src/lib/proposta/pdf.ts` (pura o bastante para teste
  unitário do “documento montado”).
- Fontes: Helvetica built-in do PDF (sem embutir TTF no MVP; acentos via WinAnsi
  / fallback documentado no código se necessário).
