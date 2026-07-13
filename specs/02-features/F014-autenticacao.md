# F014 — Autenticação (login)

## Status
Proposta — 2026-07-13

## Objetivo
Dar a cada **aluno** uma conta própria: **login**, **sessão** e **proteção das
rotas** do app. É o pré-requisito do multi-tenant ([F015](F015-multi-tenant.md)) —
sem sessão não há `user_id` pra escopar os dados — e da configuração de chaves
([F016](F016-configuracao-de-chaves.md)).

Decisão de stack em [ADR-007](../04-decisions/ADR-007-better-auth.md) (Better
Auth) e [ADR-010](../04-decisions/ADR-010-email-transacional.md) (e-mail do
magic link).

## Linguagem
- **Usuário (aluno)** — dono de uma conta; entidade de **infra de auth**, distinta
  das entidades de domínio ([01](../01-domain-model.md)).
- **Sessão** — vínculo autenticado do aluno com o app.

## Métodos de login
**Google OAuth** (principal) + **magic link** — **sem senha**. Sem cadastro com
senha, sem "recuperar senha".

## Modelos (schema)
Gerados pelo Better Auth com adapter Prisma: `User`, `Session`, `Account`,
`Verification`. Migração dedicada.

## Telas
- `/login` — botão "Entrar com Google" + campo de e-mail para magic link.
- Estado "enviamos um link para seu e-mail" (aguardando verificação).
- Logout (na navbar).

## Fluxo
1. Aluno acessa rota protegida sem sessão → redirect pra `/login`.
2. Escolhe **Google** (OAuth) ou informa e-mail → recebe **magic link** (e-mail
   via [ADR-010](../04-decisions/ADR-010-email-transacional.md)).
3. Callback cria/recupera `User` + abre `Session`; redirect pro destino original
   (ou `/`).
4. Server Actions chamam `requireUser()` (`src/lib/auth/`) → devolve o usuário da
   sessão ou lança. É o ponto único de checagem, consumido pela F015.

## Critérios de aceitação
- [ ] **AC1** — Sem sessão, acessar `/`, `/leads`, `/conteudo`, `/treino` ou
      `/configuracao` redireciona pra `/login`. Rotas de login/callback são públicas.
- [ ] **AC2** — Login com Google cria `User`+`Session` na 1ª vez e reusa nas
      seguintes (mesmo `User` pelo e-mail/Account).
- [ ] **AC3** — Magic link: informar e-mail dispara um e-mail com link válido;
      abrir o link autentica e abre sessão. Link expirado/reusado → erro claro.
- [ ] **AC4** — `requireUser()` devolve o usuário logado nas Server Actions e
      lança (tratado como erro amigável) quando não há sessão.
- [ ] **AC5** — Logout encerra a sessão e volta a barrar as rotas protegidas.
- [ ] **AC6** — Segredo de sessão e credenciais de OAuth lidos de env do servidor;
      ausência → erro descritivo no boot/health, nunca valores default.

## Decisões de implementação
- `src/lib/auth/` — config do Better Auth (adapter Prisma, providers) +
  `requireUser()`. Sem dep de Next na parte de domínio; o wiring de sessão fica
  na borda (middleware/route handlers).
- Middleware de proteção de rotas em `src/middleware.ts`.
- `src/app/login/page.tsx` (client: Google + magic link).
- Lib nova? **Sim** — `better-auth` ([ADR-007](../04-decisions/ADR-007-better-auth.md))
  e `resend` ([ADR-010](../04-decisions/ADR-010-email-transacional.md)).

## Fora do escopo (F014)
- E-mail+senha e "recuperar senha" (decidido: sem senha) — só como plano B de
  contingência (ADR-007), não default.
- Papéis/permissões (admin vs. aluno), times, convites → fase posterior.
- Escopar os **dados** por usuário → é a [F015](F015-multi-tenant.md).
- Billing/planos pagos.
