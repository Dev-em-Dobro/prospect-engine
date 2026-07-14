# ADR-010 — E-mail transacional (Resend) para magic link

## Status
Aceito — 2026-07-13

## Contexto
O login por **magic link** ([ADR-007](ADR-007-better-auth.md)) exige **enviar
e-mail transacional** (o link de acesso). É uma **lib/serviço novo** → ADR. É
**infra nossa** (não BYOK): a chave do provedor é do servidor, não do aluno.

## Decisão
Adotar o **Resend** (SDK `resend`) como provedor de e-mail transacional **em
produção**, isolado em `src/lib/email/`.

- Chave via env do servidor (`RESEND_API_KEY`) — nunca client, nunca commitada.
- Envio a partir de um **domínio verificado** (subdomínio Dev em Dobro), com
  **SPF/DKIM** configurados pra deliverability.
- Uso na Fase 2: **magic link** (obrigatório) e, se necessário, notificações
  transacionais pontuais. **Nada de marketing/disparo em massa** (mantém o
  princípio anti-spam da visão).
- Free tier cobre o volume de um beta; reavaliar se escalar.

### Dev local — Mailpit (Docker Compose)
Para testar o magic link **sem** gastar/configurar Resend, o envio local usa
**Mailpit** via `docker compose` (UI em `:8025`, SMTP em `:1025`).

- `EMAIL_PROVIDER=mailpit` aponta `src/lib/email/` para a **API HTTP** do
  Mailpit (`POST /api/v1/send`) — **sem lib SMTP nova**.
- `EMAIL_PROVIDER=resend` (produção / staging real) usa o SDK Resend.
- Remetente unificado em `EMAIL_FROM`.

## Alternativas consideradas
- **SMTP próprio + Nodemailer**: mais barato em tese, mas exige gerir servidor
  SMTP/deliverability (reputação de IP, blocklists) — trabalho que o Resend
  abstrai.
- **AWS SES**: barato e robusto, mas setup/IAM mais pesado e DX inferior pro
  nosso tamanho.
- **Postmark / SendGrid**: equivalentes; Resend escolhido pela DX no ecossistema
  Next e simplicidade do SDK.

## Consequências
### Positivas
- Magic link viável com pouco código; deliverability gerenciada.
- Uma dependência pequena e isolada em `src/lib/email/`.

### Negativas / a aceitar
- **Deliverability depende de config de domínio** (SPF/DKIM) — se o e-mail
  atrasar/cair no spam, o login trava. Mitigar com domínio verificado e teste
  antes do lançamento; plano B de e-mail+senha continua disponível (ADR-007).
- Mais um serviço externo/conta a gerenciar.
- Dev local exige Docker (Mailpit) se for testar magic link — aceitável; Google
  OAuth cobre login sem e-mail.
