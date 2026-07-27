# F021 — Pipeline / CRM do Builder (MVP)

## Status
Implementada — 2026-07-27

## Objetivo
Evoluir o Orion de “buscador de Leads” para **trilho do freela**: o aluno
organiza **Oportunidades** num pipeline por estágios, com **playbook**
(checklist) que linka os entregáveis certos em cada passo — do primeiro
contato até a entrega.

**North star do MVP:** levar um Lead de “prospectado” até “fechado” sem sair
do Orion e sem travar em “e agora?”.

Pré-requisitos: [F015](F015-multi-tenant.md), [F020](F020-menu-entregaveis.md).

## Conceitos (linguagem ubíqua)

| Conceito | Significado |
|----------|-------------|
| **Oportunidade** | Lead (ou cliente manual) que o aluno decidiu trabalhar. Card do pipeline. |
| **Estágio** | Coluna do board: onde a Oportunidade está na jornada. |
| **Playbook** | Checklist padrão semeada na criação, com links de entregáveis. |
| **Tarefa** | Item do playbook (título + estágio + entregável opcional + check). |
| **Nota** | Histórico livre na Oportunidade. |

Não confundir com `Lead.status` ([F006](F006-follow-up-e-funil.md) /
[F010](F010-dashboard-funil.md)): o funil do Lead mede a **prospecção**; a
Oportunidade mede a **jornada comercial + entrega**. **Sem sync automático**
entre os dois no MVP.

## Estágios (board)

Colunas ativas: `novo` → `abordado` → `qualificando` → `proposta` →
`fechado` → `producao` → `entregue`.

- **Perdido** — `status = lost` (arquivo; fora das colunas).
- **Ganho** — `status = won` (métrica; Fechado em diante pode marcar ganho).
- **Recorrência** — fora do board no MVP (tarefas podem existir no playbook).

## Escopo MVP

1. Botão **Trabalhar este lead** em `/leads` → cria Oportunidade em `novo` + seed do playbook; dedupe se já houver `open` para o mesmo Lead.
2. Form **Adicionar cliente** (manual / indicação).
3. Board `/pipeline` — colunas, contadores, cards; mover estágio via dropdown (sem DnD).
4. Detalhe — dados, valor, checklist agrupada, notas, WhatsApp, Ganho/Perdido.
5. Mini painel — contadores + faturamento (`sum(valor)` onde `status = won`).
6. Persistência por `user_id` (F015).

## Fora do MVP

Briefing/contrato/mockup nativos; DnD; lembretes; sync com `Lead.status`;
coluna Recorrência; ranking da turma; nova lib de kanban.

## Modelo de dados

Ver [domain model](../01-domain-model.md). Tabelas: `oportunidade`,
`tarefa_oportunidade`, `nota_oportunidade`.

Playbook: constante em código (`src/lib/pipeline/playbook.ts`), semeada na
criação.

Entregáveis: deep links internos `/entregaveis/{slug}` (F020).

## Rotas / UI

| Rota | Descrição |
|------|-----------|
| `/pipeline` | Board + métricas + form manual |
| `/pipeline/[id]` | Detalhe da Oportunidade |
| Sidebar → Prospecção → Pipeline | Nav |

## Critérios de aceitação

- [ ] **AC1** — “Trabalhar este lead” cria Oportunidade em `novo` com dados do Lead + playbook; se já existe `open` para o Lead, reutiliza.
- [ ] **AC2** — Board mostra colunas com cards no estágio certo e contadores; topo com ganhos e faturamento.
- [ ] **AC3** — Mudar estágio (dropdown) persiste e reflete no board.
- [ ] **AC4** — Checklist do estágio atual com links `/entregaveis/...`; marcar tarefa persiste e atualiza %.
- [ ] **AC5** — Notas com data, persistentes.
- [ ] **AC6** — Ganho com valor → `status=won`, entra no faturamento.
- [ ] **AC7** — Perdido com motivo → sai das colunas ativas.
- [ ] **AC8** — Criação manual (negócio + WhatsApp) com `origem=manual` e playbook.

## Branch / deploy

`feature/F021-pipeline` → PR → `feature/preview` → `main`.
