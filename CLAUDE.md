# prospect engine

Motor de prospecção automatizada, genérico e sem marca: cada pessoa roda a
sua própria instância, configurada com as suas chaves de API (e, opcional,
a sua empresa/oferta em `src/lib/brand.ts`). Coleta estabelecimentos,
diagnostica presença digital, prioriza por score e gera mensagens de
outreach via Claude API.

## Regras absolutas
- **Specs em `/specs` são a fonte da verdade.** Código segue spec, nunca o contrário.
- **Mudança de comportamento exige mudança de spec ANTES do código.** Sem exceção.
- **Toda feature tem ID** (`F001`, `F002`, ...). Commits e PRs referenciam o ID.
- **Linguagem ubíqua** definida em `/specs/01-domain-model.md`. Não usar sinônimos
  (é "Lead", não "prospect"; "Diagnóstico", não "análise"; "Dor", não "problema"
  genérico; "Outreach", não "mensagem" no sentido de domínio).

## Stack fixa
- Next.js 15 (App Router) + TypeScript estrito
- PostgreSQL hospedado no Neon
- Prisma ORM
- Tailwind + shadcn/ui
- Claude API para geração de outreach
- Google Places API + PageSpeed Insights API para coleta e diagnóstico
- **Sem workers, sem filas** — tudo via Server Actions síncronas na Fase 1
- **Sem nova lib sem ADR** em `/specs/04-decisions/`

## Convenções de código
- Lógica de domínio em `src/lib/`, **sem dependência de Next**
- Server Actions em `src/actions/`, finas, só orquestram `src/lib/`
- Tipos derivados do schema Prisma, **não duplicados**
- Validação de input com Zod nas Server Actions
- UI em `src/components/` (shadcn/ui como base)

## Fluxo de trabalho
1. Ler a spec da feature em `/specs/02-features/F00X-*.md`
2. Atualizar/criar plano de implementação
3. Implementar contra os critérios de aceitação da spec
4. Validar manualmente na dashboard
5. Commit com mensagem `F00X: <descrição>`
