# F015 — Multi-tenant (isolamento por aluno)

## Status
Proposta — 2026-07-13

## Objetivo
Escopar **todos** os dados por aluno: cada `User` ([F014](F014-autenticacao.md))
vê e manipula só os **seus** Leads, Diagnósticos, Dores e Outreaches. É a
**fundação de dados** da Fase 2 — sem isso, um aluno veria os Leads de outro.

Decisão de arquitetura em [ADR-008](../04-decisions/ADR-008-multi-tenant.md)
(row-level tenancy por `user_id`).

## Mudança no schema
Adicionar `user_id` (FK → `User`, **not null**) + índice por `user_id` em:
**Lead, Diagnóstico, Dor, Outreach** e `UserApiKeys` ([F016](F016-configuracao-de-chaves.md)).
A [01-domain-model](../01-domain-model.md) passa a refletir `user_id` nessas
entidades (atualizar junto desta migração).

**Migração de dados da Fase 1:** os registros existentes recebem o `user_id` da
conta do operador atual (backfill), depois a coluna vira not null.

## Regra de acesso
Toda query e Server Action obtém `user_id` via `requireUser()`
([F014](F014-autenticacao.md)) e **filtra por ele** — em: coletar, diagnosticar,
priorizar, listar, outreach, follow-up (F006), desfecho, proposta (F012),
objeções (F011), simulador (F013), dashboard (F010) e treino. Criações gravam o
`user_id` da sessão.

Padronizar num helper por tenant (ex.: `src/lib/db/scoped.ts` ou `where` sempre
derivado de `requireUser()`), pra o filtro não depender de memória caso a caso.

## Vazamento de cache
Revisar `revalidatePath`/`revalidateTag` e qualquer memoização pra **não
compartilhar** dados entre usuários (chavear cache por `user_id` quando houver).

## Critérios de aceitação
- [ ] **AC1** — `Lead`, `Diagnóstico`, `Dor`, `Outreach` e `UserApiKeys` têm
      `user_id` not null com índice; a migração faz backfill sem perder dado.
- [ ] **AC2** — Coletar/diagnosticar/priorizar/outreach criam registros com o
      `user_id` da sessão.
- [ ] **AC3** — **Teste de isolamento:** logado como aluno A, nenhuma rota,
      action ou dashboard retorna dado do aluno B (nem por id direto na URL).
- [ ] **AC4** — Dashboard de funil (F010) e `/treino` leem **só** os dados do
      aluno logado.
- [ ] **AC5** — Deduplicação de Lead por `place_id` passa a ser **por usuário**
      (`unique(user_id, place_id)`): dois alunos podem ter o mesmo estabelecimento.
- [ ] **AC6** — Acesso a um recurso de outro usuário por id (ex.: `/leads/{id}`
      de B) retorna 404/erro, não o dado.
- [ ] **AC7** — Nenhuma query de domínio roda sem filtro de `user_id` (revisão +
      teste cobrindo as Server Actions existentes).

## Decisões de implementação
- Ajustar o `unique` de `Lead.place_id` para `@@unique([user_id, place_id])`
  (impacta a F001, "ignorados por já existir" passa a ser por aluno).
- Helper único de escopo por tenant consumido por todas as actions.
- Sem lib nova.

## Fora do escopo (F015)
- Papéis/permissões e compartilhamento entre contas.
- Postgres RLS como camada extra → reavaliar pós-beta (ADR-008).
- Limites de uso por aluno → tratados no BYOK/lançamento ([07](../07-lancamento-para-alunos.md)).
