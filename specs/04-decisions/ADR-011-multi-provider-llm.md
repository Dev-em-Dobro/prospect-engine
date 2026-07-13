# ADR-011 — Camada multi-provider de LLM (Anthropic/OpenAI/Gemini)

## Status
Proposta — 2026-07-13 (a **decisão de negócio** — suportar os 3 provedores — está
fechada em [07](../07-lancamento-para-alunos.md); a **abordagem técnica** abaixo
segue em aberto até a F017 ser implementada)

## Contexto
Hoje **tudo** usa o `@anthropic-ai/sdk` ([ADR-005](ADR-005-anthropic-sdk-outreach.md))
com **structured output** (Zod/JSON Schema) e **visão** (F008). A Fase 2 quer que
o aluno escolha entre **Anthropic, OpenAI e Gemini** ([F017](../02-features/F017-multi-provider-llm.md)),
usando a **própria chave** (BYOK). Suportar 3 provedores exige uma **camada de
abstração** e introduz **libs novas** (`openai`, SDK do Gemini) → ADR.

O ponto difícil não é texto: é **paridade de structured output + visão** nos 3.

## Decisão (proposta)
Uma **interface única de LLM** em `src/lib/llm/`, com adapters por provider e
**Anthropic como referência/default**.

- Interface `LlmProvider`: `generateText`, `generateStructured(schema)` e
  `generateVision(imagem, schema?)`.
- Adapter por provider mapeando as diferenças: Anthropic (`messages.parse` +
  `zodOutputFormat`), OpenAI (structured outputs / `response_format`), Gemini
  (`responseSchema`). Visão idem (formato de imagem por provider).
- Provider e modelo escolhidos pelo aluno no `/configuracao`; a chave vem do
  BYOK ([F016](../02-features/F016-configuracao-de-chaves.md)).
- **Rollout faseado:** MVP com **só Anthropic**; **OpenAI e Gemini como
  fast-follow**. A config aceita as 3 chaves desde já.

## Alternativas consideradas
- **Manter só Anthropic**: não atende o requisito de escolha do aluno (mas segue
  sendo o default e o MVP).
- **Vercel AI SDK** (interface unificada pronta, com structured output e visão):
  **principal alternativa a avaliar na F017** — pouparia boa parte do trabalho de
  adapter/paridade, ao custo de uma dependência maior e menos controle fino.
  Decidir interface-própria vs. AI SDK **antes** de implementar a F017.
- **LangChain**: rejeitado — peso e abstrações demais pro escopo.

## Consequências
### Positivas
- Aluno usa o provedor que já tem/prefere; Anthropic continua como qualidade de
  referência.
- Abstração isola o resto do app das diferenças de API.

### Negativas / a aceitar
- **Paridade de visão + structured output** nos 3 é o item mais caro da Fase 2 —
  por isso o rollout faseado (MVP só Anthropic).
- 2 libs novas quando OpenAI/Gemini entrarem; cada provider tem quirks de schema.
- A escolha interface-própria vs. Vercel AI SDK fica **pendente** pra F017.
