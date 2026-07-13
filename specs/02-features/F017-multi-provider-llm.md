# F017 — Multi-provider LLM (Anthropic/OpenAI/Gemini)

## Status
Proposta — 2026-07-13 · **fast-follow** (pós-MVP; ver [07](../07-lancamento-para-alunos.md))

## Objetivo
Deixar o aluno **escolher o provedor de IA** — Anthropic, OpenAI ou Gemini —
usando a **própria chave** ([F016](F016-configuracao-de-chaves.md)). Todas as
features de IA (outreach, conteúdo, diagnóstico UX, proposta, objeções,
simulador) passam a rodar pelo provedor escolhido, mantendo **structured output**
e **visão**.

Abordagem técnica em [ADR-011](../04-decisions/ADR-011-multi-provider-llm.md)
(interface única + adapters; **decisão interface-própria vs. Vercel AI SDK segue
em aberto** e deve ser fechada antes de implementar).

## Escopo e faseamento
- **MVP do lançamento:** só **Anthropic** (o que já existe, ADR-005). Esta feature
  é **fast-follow**.
- **F017:** adicionar **OpenAI** e **Gemini** atrás da abstração, com Anthropic
  como referência/default.

## Camada de abstração
Interface `LlmProvider` em `src/lib/llm/`:
- `generateText(prompt, opts)`
- `generateStructured(prompt, schema, opts)` — JSON Schema / Zod
- `generateVision(imagem, prompt, schema?, opts)` — usada pela F008

Um adapter por provider mapeando as diferenças:
- **Anthropic** — `messages.parse` + `zodOutputFormat` (ADR-005).
- **OpenAI** — structured outputs / `response_format`.
- **Gemini** — `responseSchema`.

Seleção de provider + modelo vem da config do aluno (F016). As features chamam a
interface, **não** um SDK específico.

## Critérios de aceitação
- [ ] **AC1** — Com provider = Anthropic, todas as features de IA seguem
      idênticas ao comportamento atual (nenhuma regressão).
- [ ] **AC2** — Trocar o provider na `/configuracao` faz as features usarem o
      provedor escolhido, com a chave do aluno (F016).
- [ ] **AC3** — **Structured output** funciona nos 3 provedores para os schemas
      já usados (outreach, proposta, objeções, scorecard do simulador, etc.).
- [ ] **AC4** — **Visão** (F008) funciona nos provedores que a suportam; onde não
      houver suporte pro modelo escolhido, erro claro orientando trocar de modelo.
- [ ] **AC5** — Chave/permissão inválida do provedor → erro específico, sem
      quebrar a app.
- [ ] **AC6** — Nenhuma feature importa SDK de provider direto: todas passam pela
      interface `LlmProvider`.

## Decisões de implementação
- `src/lib/llm/` — interface + adapters; refatorar `outreach`, `conteudo`,
  `diagnostico-ux`, `proposta`, `objecoes`, `simulador` pra consumir a interface.
- **Antes de codar:** decidir interface-própria vs. **Vercel AI SDK** (ADR-011).
- Libs novas quando OpenAI/Gemini entrarem (`openai`, SDK Gemini) — cobertas pelo
  ADR-011.

## Fora do escopo (F017)
- Roteamento automático/fallback entre provedores (escolha é explícita do aluno).
- Comparação de custo/qualidade entre provedores na UI.
- Grok e outros provedores (fora de escopo — [07](../07-lancamento-para-alunos.md)).
