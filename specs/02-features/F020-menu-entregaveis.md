# F020 — Menu de entregáveis (Builders Club)

## Status
Implementada — 2026-07-27

## Objetivo
Exibir os materiais da Consultoria Freela no Orion: grupo **Materiais** na sidebar,
páginas em `/entregaveis` e links externos para a central hospedada.

Pré-requisito de acesso: compra verificada ([F019.1](F019.1-ativacao-acesso.md)).

## Catálogo
Config estática em `src/lib/entregaveis/catalogo.ts` — espelha
[entregaveis-psi.vercel.app](https://entregaveis-psi.vercel.app/).

## Rotas
| Rota | Descrição |
|------|-----------|
| `/entregaveis` | Visão geral (lista) |
| `/entregaveis/[slug]` | Detalhe + botão "Abrir material" |
| `/ativar-acesso` | Ativação quando compra não verificada |

## Gate
Layout de `/entregaveis/*` chama `redirectSeCompraPendente()`.
Orion principal permanece aberto sem compra.

## Critérios de aceitação
- [ ] **AC1** — Sidebar exibe grupo "Materiais" com visão geral + itens disponíveis.
- [ ] **AC2** — Usuário sem compra verificada é redirecionado a `/ativar-acesso`.
- [ ] **AC3** — Página de detalhe abre URL externa do material.
- [ ] **AC4** — Itens "em breve" não aparecem no menu lateral.
