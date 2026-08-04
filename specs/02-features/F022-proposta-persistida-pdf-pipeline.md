# F022 — Proposta persistida, PDF e Pipeline

## Status
Em construção — 2026-08-03

## Objetivo
Evoluir a [F012](F012-gerador-de-proposta.md): a **Proposta** deixa de ser só
painel efêmero e passa a ser **entidade persistida**, exportável em **PDF** e
acionável a partir da **Oportunidade** do Pipeline ([F021](F021-pipeline-crm.md)).

Fecha o loop `qualificado → proposta → ganho`: o aluno gera, guarda, baixa PDF,
marca como enviada e ancora o valor no card do Pipeline.

## Linguagem
- **Proposta** — artefato comercial (prosa + faixa de preço). Agora é entidade
  do domínio (Lead 1—N; opcionalmente ligada a uma Oportunidade).
- Reusa **Serviço**, **Faixa de preço** e o fluxo de geração da F012
  (`src/lib/proposta/*`).

## Escopo (3 frentes)

### 1) Persistência
Cada geração bem-sucedida **grava** uma Proposta (versão incremental por Lead).
UI lista as propostas do Lead / da Oportunidade; permite **Abrir** (reabrir
rascunho), **Copiar**, **Baixar PDF**, **Marcar como enviada** e **Excluir**
rascunho (enviadas não excluem pelo MVP — só rascunhos).

### 2) PDF
Rota autenticada de download `.pdf` com layout **cliente-facing**: fundo,
faixa de destaque, tipografia embutida (Source Sans 3) e seções estruturadas
(resumo, escopo, entregáveis, prazo, investimento). Sem número de versão no
documento. Lib: [`pdf-lib`](../04-decisions/ADR-014-pdf-lib-proposta.md).

### 3) Pipeline
No detalhe da Oportunidade (`/pipeline/[id]`):
- Botão **Gerar Proposta** se houver `lead_id` + Diagnóstico (reusa F012).
- Ao gerar: persiste com `oportunidade_id`; sugere **aplicar `faixa_min` em
  `Oportunidade.valor`** (ação explícita do aluno, não automática surpresa).
- Histórico: **Abrir** reexibe painel completo (copiar / PDF / marcar enviada);
  **Excluir** remove rascunho.
- Opcional: mover estágio para `proposta` via dropdown já existente (F021) —
  a F022 **não** força a transição sozinha (mesmo espírito da F012 +
  `registrarDesfecho`).

Oportunidade **manual sem Lead** → mensagem clara: vincular/trabalhar a partir
de um Lead diagnosticado (MVP não inventa Diagnóstico a partir de dados manuais).

## Modelo (delta)

Ver [domain model](../01-domain-model.md). Campos principais:

| Campo | Tipo | Notas |
|-------|------|-------|
| `lead_id` | string | FK obrigatória (geração ancorada no Lead) |
| `oportunidade_id` | string \| null | Quando gerada no Pipeline |
| `versao` | int | 1, 2, … por Lead |
| prosa | resumo, escopo (JSON), entregaveis (JSON), prazo, observacoes | |
| preço | `faixa_min`, `faixa_max`, `servicos` (JSON) | Do cálculo F012 |
| `texto_copiavel` | text | Snapshot no momento da geração |
| `enviada` / `enviada_em` | bool / datetime? | Manual |
| `gerado_em` | datetime | |

Multi-tenant: `user_id` em toda query ([F015](F015-multi-tenant.md)).

## Fluxo

### Gerar (Lead ou Oportunidade com Lead)
1. Reusa `gerarPropostaAction` estendida: após sucesso F012, `INSERT` Proposta
   (`versao = max(versao)+1` do Lead).
2. Consome cota `proposta` (F018) **uma vez** por geração (já existente).
3. Retorna proposta + `propostaId` para Copiar / PDF / marcar enviada.

### Marcar enviada
`PATCH`/action: `enviada=true`, `enviado_em=now()`. Não altera `Lead.status`
nem `Oportunidade.estagio` (aluno usa botões já existentes).

### Excluir rascunho
Action: `DELETE` hard da Proposta se `enviada=false` e `user_id` confere.
Enviada → erro descritivo (MVP).

### Reabrir
Na UI do histórico, **Abrir** expande o painel com prosa + ações (Copiar, PDF,
marcar enviada, aplicar valor) a partir dos campos persistidos — sem nova
chamada LLM / sem consumir cota.

### PDF
`GET /api/propostas/[id]/pdf` (sessão obrigatória, escopo `user_id`) →
`application/pdf` attachment com layout visual (fonte embutida + fundo).

### Aplicar valor no Pipeline
Action: `oportunidade.valor = faixa_min` da Proposta escolhida (confirmação na UI).

## Critérios de aceitação
- [ ] **AC1** — Gerar Proposta no Lead persiste linha; regenerar cria nova
      `versao` sem apagar a anterior.
- [ ] **AC2** — Painel mostra histórico com Abrir, Copiar, Baixar PDF, Marcar
      enviada; rascunho pode ser **excluído**.
- [ ] **AC3** — PDF baixa com prosa + linha de preço, tipografia embutida e
      fundo; aluno de outro tenant recebe 404/403; sem “vN” no documento.
- [ ] **AC10** — Abrir rascunho reexibe conteúdo persistido sem nova geração LLM.
- [ ] **AC11** — Excluir rascunho remove a linha; tentativa em enviada falha.- [ ] **AC4** — Em `/pipeline/[id]` com `lead_id` + Diagnóstico: Gerar Proposta
      grava com `oportunidade_id` preenchido.
- [ ] **AC5** — Sem `lead_id` ou sem Diagnóstico: erro descritivo, sem chamada LLM.
- [ ] **AC6** — “Aplicar valor sugerido” grava `Oportunidade.valor = faixa_min`.
- [ ] **AC7** — Gerar **não** muda sozinho `Lead.status` nem `Oportunidade.estagio`.
- [ ] **AC8** — Migration só via `DATABASE_URL_STAGING` até validação no Preview.
- [ ] **AC9** — Funções puras de montagem do PDF testáveis (texto → bytes) sem
      rede; libs F012 (servicos/precos) intactas.

## Decisões de implementação
- Estender `src/actions/leads/gerarProposta.ts` (persistir) + action
  `marcarPropostaEnviada` + `aplicarValorProposta` (pipeline).
- `src/lib/proposta/persistir.ts`, `src/lib/proposta/pdf.ts`.
- UI: evoluir `gerar-proposta-button.tsx`; bloco no detalhe da Oportunidade.
- Schema Prisma + migration `f022_proposta_persistida`.
- PDF: [ADR-014](../04-decisions/ADR-014-pdf-lib-proposta.md).

## Fora do escopo
- Pacotes bronze/prata/ouro (3 faixas) — playbook menciona; fica F022.1.
- Edição inline da prosa persistida (MVP: regenerar = nova versão).
- Assinatura digital / envio automático no WhatsApp.
- Proposta sem Lead (cliente 100% manual).

## Relação com F012
F012 permanece a spec da **geração** (dores → serviços → preço → prosa).
F022 adiciona **persistência, PDF e Pipeline**. Atualizar F012 “Fora do escopo”
apontando para esta feature.
