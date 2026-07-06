# Contrato — ScreenshotOne API

Captura screenshot de uma URL com browser real. **Provider alternativo**
da F008 — ativado só quando `SCREENSHOTONE_ACCESS_KEY` está definida
(caminho de deploy serverless); o primário na Fase 1 é o Playwright
local. Decisão: [ADR-006](../04-decisions/ADR-006-screenshot-api-externa.md).

## Endpoint
```
GET https://api.screenshotone.com/take
```

## Parâmetros usados
| Param                  | Valor                          |
|------------------------|--------------------------------|
| `access_key`           | `SCREENSHOTONE_ACCESS_KEY` env |
| `url`                  | website do Lead                |
| `viewport_width`       | 1280 (desktop) / 390 (mobile)  |
| `viewport_height`      | 800 (desktop) / 844 (mobile)   |
| `format`               | `jpg`                          |
| `image_quality`        | 80                             |
| `block_cookie_banners` | `true`                         |
| `block_ads`            | `true`                         |
| `timeout`              | 30 (segundos, lado deles)      |

## Resposta
- `200` → corpo é a imagem JPEG (bytes).
- `4xx/5xx` → corpo JSON com `error_message`; tratar como falha do
  screenshot (a F008 retorna erro descritivo, nada é persistido).

## Limites e custo (junho/2026)
- Free tier: 100 screenshots/mês.
- Plano pago: ~US$17/mês por 2.000.
- Cada Diagnóstico UX consome **2** screenshots (desktop + mobile) →
  free tier cobre ~50 diagnósticos/mês.
