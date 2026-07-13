# ADR-009 — Cifra das chaves BYOK em repouso

## Status
Aceito — 2026-07-13 (decisão registrada em
[07 · Decisões tomadas](../07-lancamento-para-alunos.md))

## Contexto
No BYOK ([F016](../02-features/F016-configuracao-de-chaves.md)) o aluno cola as
**próprias chaves de API** (Google, provedor de IA, ScreenshotOne). Guardar
segredo de terceiros muda o patamar de risco: **nunca** em texto puro, **nunca**
exposto ao client. É uma decisão de **segurança** relevante → ADR (a cifra usa o
módulo `crypto` **nativo** do Node, então **não** é lib nova).

## Decisão
Cifrar cada chave em repouso com **AES-256-GCM**, usando uma **chave-mestra em
env var do servidor** (Vercel Secret) no MVP.

- Módulo isolado `src/lib/seguranca/cifra.ts` (`cifrar`/`decifrar`), sem dep de
  Next. Interface pensada como **envelope**: hoje a chave-mestra vem da env;
  amanhã pode vir de um **KMS gerenciado** sem tocar nos call sites.
- Chave-mestra: **32 bytes** em `BYOK_MASTER_KEY` (base64). Ausente → app recusa
  operar as features BYOK com erro descritivo.
- Por registro: **IV/nonce aleatório**; persistir `iv + ciphertext + authTag` +
  uma coluna de **versão de chave** (`key_version`) pra rotação futura.
- **Nunca logar** segredo nem devolvê-lo ao client — a UI mostra só máscara e
  status (configurada / inválida / faltando).

## Alternativas consideradas
- **Texto puro / hash**: fora de questão — precisamos do valor pra chamar a API,
  então tem que ser cifra reversível, nunca plaintext.
- **KMS gerenciado agora** (AWS/GCP KMS): mais seguro (chave nunca sai do HSM,
  rotação e auditoria nativas), mas adiciona infra, IAM, custo e latência —
  **overkill pro MVP**. Adotável depois graças à interface envelope.
- **libsodium/tweetnacl**: lib nova sem ganho real sobre o AES-GCM do `crypto`
  nativo pra este caso.

## Consequências
### Positivas
- Segredos protegidos em repouso sem infra nova; roda na Vercel de imediato.
- Caminho de evolução pra KMS já desenhado (troca só a fonte da chave-mestra).
- `key_version` habilita rotação sem migração destrutiva.

### Negativas / a aceitar
- A chave-mestra vira **segredo crítico único**: se vazar, vaza tudo. Mitigar:
  Vercel Secret, acesso restrito, rotação planejada, e migração pra KMS quando a
  escala/compliance pedir.
- Perder a chave-mestra = perder as chaves cifradas (aluno reconfigura). Aceito.
