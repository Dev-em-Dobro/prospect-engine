# ADR-006 — Screenshot via Playwright local (API externa como fallback de deploy)

## Status
Aceito — 2026-06-12 (revisado no mesmo dia: Playwright assume como provider
primário; a versão original escolhia só a API externa)

## Contexto
A F008 (Diagnóstico UX via IA) precisa de screenshots do site do Lead
(desktop e mobile) para a análise de visão da Claude API. Há duas formas
de obter screenshots:

1. **Browser headless local** (Playwright) — lib nova (~300MB com o
   Chromium), screenshots grátis e ilimitados, mas não funciona em
   deploy serverless (Vercel).
2. **API externa de screenshot** (ScreenshotOne, ApiFlash, urlbox...) —
   um GET com `fetch` nativo; zero dependência, mas free tier de 100
   shots/mês (~50 diagnósticos) e ~US$17/mês depois.

A versão original deste ADR escolhia a API externa por causa do deploy
serverless. Revisado: **na Fase 1 a ferramenta roda localmente**
(`npm run dev`, uso interno de um freelancer) — o constraint de deploy
não existe ainda, e o custo/limite da API externa incomoda no dia a dia.

## Decisão
**Playwright (Chromium headless) é o provider primário** de screenshot,
isolado em `src/lib/diagnostico-ux/`. A **ScreenshotOne permanece como
provider alternativo**: se `SCREENSHOTONE_ACCESS_KEY` estiver definida,
ela é usada no lugar do Playwright — esse é o caminho de deploy
serverless, sem mudança de código.

- Nova dependência: **`playwright`** (este ADR cumpre a regra
  "sem nova lib sem ADR").
- Setup local: `npx playwright install chromium` (uma vez). Chromium
  ausente → erro descritivo na UI com o comando.
- `serverExternalPackages: ["playwright"]` no `next.config.ts` (o Next
  não pode bundlar a lib).
- Seleção do provider é automática e determinística:
  `SCREENSHOTONE_ACCESS_KEY` definida → API externa; ausente → Playwright.

## Alternativas consideradas
- **Só API externa** (decisão original): rejeitada para a Fase 1 — custo
  e limite mensal num fluxo que queremos usar à vontade, e uma conta
  externa a mais pra gerenciar, sem ganho enquanto não há deploy.
- **Só Playwright**: rejeitado — fecharia a porta do deploy serverless
  (Vercel está na stack alvo). Manter o provider externo atrás de env é
  barato (um arquivo).
- **Puppeteer**: equivalente; Playwright escolhido pela API de devices
  (emulação mobile pronta) e manutenção mais ativa.

## Consequências

### Positivas
- Screenshot a custo zero e sem limite; único custo por diagnóstico é o
  Claude (~R$0,06).
- Sem conta/chave externa pra começar a usar a F008.
- Emulação mobile real (device descriptor do iPhone), melhor que só
  viewport estreito.

### Negativas / a aceitar
- ~300MB de Chromium na máquina local e ~1–3s de launch por diagnóstico.
- Sites que bloqueiam headless ou exigem interação (cookie wall) podem
  render pior que na ScreenshotOne (que bloqueia banners) — aceito; se
  virar problema recorrente, configurar a chave e usar o provider externo.
- Em deploy serverless o Playwright não sobe — é obrigatório configurar
  `SCREENSHOTONE_ACCESS_KEY` lá (documentado na F008).
