# Contrato — PageSpeed Insights API (v5)

Usada na F002 para medir `performance_mobile` do Diagnóstico.

Doc oficial: https://developers.google.com/speed/docs/insights/v5/get-started

## Autenticação
- Query param `key=${PAGESPEED_API_KEY}`.
- A chave deve ter a **PageSpeed Insights API** habilitada no projeto
  Google Cloud (pode ser a mesma chave da Places, com as duas APIs
  habilitadas).
- A API funciona sem chave, mas com rate limit baixo demais pra uso
  programático — a chave é **obrigatória** no prospec-dev.

## Endpoint usado na F002 — runPagespeed
`GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed`

### Query params
| Param      | Valor                  | Notas                          |
|------------|------------------------|--------------------------------|
| `url`      | URL final do site      | URL-encoded, com scheme        |
| `strategy` | `MOBILE`               | F002 mede só mobile            |
| `category` | `PERFORMANCE`          | reduz payload e tempo de resposta |
| `key`      | `${PAGESPEED_API_KEY}` |                                |

### Resposta (sucesso 200) — campos usados
```json
{
  "lighthouseResult": {
    "categories": {
      "performance": { "score": 0.43 }
    }
  }
}
```

`score` vem como fração **0–1**. Mapear para o domínio:
`performance_mobile = Math.round(score * 100)`.

### Comportamento e erros
| Situação                                  | Tratamento na F002                                |
|-------------------------------------------|---------------------------------------------------|
| Demora típica de 10–25s por análise       | Timeout de 30s via `AbortController`              |
| 400 — URL inválida/inacessível            | `performance_mobile = null`                       |
| 429 — quota excedida                      | `performance_mobile = null`                       |
| 500 — Lighthouse falhou (ex.: `ERRORED_DOCUMENT_REQUEST`) | `performance_mobile = null`       |
| `lighthouseResult` ausente na resposta    | `performance_mobile = null`                       |

Falha do PSI **nunca** aborta o Diagnóstico — degrada para
`performance_mobile = null` (decisão da F002).

### Quota (junho/2026)
Gratuita: **25.000 requests/dia**, 240/minuto. Irrelevante para o uso
esperado (~200 diagnósticos/mês).

## Tipo TypeScript esperado em `src/lib/pagespeed/`
```ts
/**
 * Roda o PSI mobile e retorna o score 0–100.
 * Lança erro tipado (status + message) em falha HTTP/timeout —
 * quem decide degradar pra null é a Server Action.
 */
export async function performanceMobile(url: string): Promise<number>;
```

A camada `lib/pagespeed` é responsável por:
1. Montar a query string (incl. `strategy=MOBILE`, `category=PERFORMANCE`).
2. Mapear `lighthouseResult.categories.performance.score` → int 0–100.
3. Lançar erro tipado em falha HTTP, timeout ou resposta sem score.

A Server Action consome o número, **não** o JSON cru do Lighthouse.

## Fora deste contrato
- `strategy=DESKTOP` — não usado na Fase 1.
- Demais categorias (`ACCESSIBILITY`, `SEO`, `BEST_PRACTICES`) — possível
  insumo pra Dores futuras, exigirá atualização deste contrato.
- Métricas de campo (CrUX / `loadingExperience`) — não usadas; o
  `tempo_carregamento_ms` do Diagnóstico é medido pelo próprio sistema
  (ver F002), não pelo PSI.
