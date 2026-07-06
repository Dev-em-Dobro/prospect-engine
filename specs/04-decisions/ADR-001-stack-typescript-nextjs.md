# ADR-001 — Stack TypeScript + Next.js

## Status
Aceito — 2026-05-13

## Contexto
- Desenvolvedor solo construindo uma ferramenta interna.
- Quer um stack único pra back e front, sem split de repositórios.
- Quer deploy trivial (idealmente um clique).
- Tem preferência pessoal por TypeScript em vez de Python como linguagem
  primária do projeto.
- Escopo da Fase 1 é pequeno, mas a ferramenta deve poder crescer
  (mais features, eventualmente alguns workers, possivelmente ML leve).

## Decisão
Adotar **Next.js 15 (App Router) + TypeScript estrito** como monolito único.

- Front, API (via Server Actions e Route Handlers) e lógica de domínio no
  mesmo projeto.
- `tsconfig` com `strict: true` e flags adicionais (`noUncheckedIndexedAccess`,
  `noImplicitOverride`).
- Deploy alvo: Vercel.

## Alternativas consideradas
- **Python + FastAPI + frontend separado (Vue/React)**: dois deploys, dois
  build pipelines, dois ecossistemas. Overhead alto pra dev solo.
- **Python + Streamlit**: rapidíssimo pra começar, mas teto baixo de UX e
  difícil de evoluir pra um produto real.
- **Django + Admin**: maduro e produtivo, mas Python — descartado por
  preferência declarada.
- **Remix / SvelteKit**: viáveis, mas Next.js tem o ecossistema mais
  maduro pra Server Actions + integração Vercel + shadcn/ui.

## Consequências

### Positivas
- Produtividade alta com um único stack.
- Deploy num clique na Vercel.
- Tipagem ponta-a-ponta (banco → server action → componente).
- Ecossistema React + shadcn/ui acelera UI.

### Negativas / a aceitar
- Perde acesso direto ao ecossistema Python pra scraping (Scrapy,
  Playwright wrappers maduros) e pra ML (scikit, pandas). Aceitável
  porque o escopo atual não exige isso — quando precisar, pode ser
  resolvido via job externo ou microserviço.
- App Router ainda evolui rápido; pode haver breaking changes entre
  minor versions do Next.
