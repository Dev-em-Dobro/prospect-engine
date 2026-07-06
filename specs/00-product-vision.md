# 00 — Product Vision

## Usuário
Um freelancer dev (eu), operando solo. Não há multi-tenant, equipe ou cliente
externo usando o sistema. Ferramenta interna.

## Problema
Prospecção manual via boca-a-boca, indicação e busca aleatória em mapa consome
tempo, é inconsistente e não escala. Não há método repetível pra identificar
negócios locais que de fato precisam de um dev (site ruim, lento, ou sem site)
antes de iniciar uma abordagem.

## Solução
Um sistema que:
1. Coleta estabelecimentos por região/categoria via Google Places API
2. Diagnostica a presença digital de cada um (site, HTTPS, performance mobile)
3. Detecta **Dores** concretas (sem site, site lento, sem HTTPS, etc.)
4. Calcula um **score** (0–100) e prioriza
5. Gera mensagens de outreach personalizadas via Claude API
6. Mostra tudo numa dashboard simples onde marco o status manualmente

## Resultado esperado
**10 Leads prontos por semana, sem prospecção manual ativa.**

"**Lead pronto**" = score acima de um threshold definido + Diagnóstico executado +
ao menos uma Dor detectada + Outreach gerado e pronto pra enviar. (Termo
deliberadamente distinto do status de funil `qualificado`, que é a qualificação
de venda *depois* da resposta — ver [domain model](01-domain-model.md).)

## Restrições
- **LGPD**: só dados públicos (Google Places). Sem enriquecimento via dados
  pessoais. Sem disparos automáticos sem consentimento — envio é manual.
- **Orçamento de APIs baixo**: Google Places, PageSpeed e Claude API têm
  custo. Operar dentro do free tier ou em valores marginais (~R$50/mês teto).
- **Ferramenta interna**: sem auth multi-usuário, sem SLA, sem onboarding.
  Otimizar pra um único operador.
- **Tempo**: operações podem levar até 30s (síncronas). Aceitável.

## Pilar complementar — conteúdo inbound (F007)
Além da prospecção **outbound** (achar o Lead e abordar), há um pilar
**inbound**: gerar **Ideias de Vídeo** pro YouTube que funcionam como funil e
atraem clientes até o **diagnóstico gratuito**. Complementa, não substitui, o
núcleo. Reaproveita a Claude API (ADR-005), sem API/lib nova e sem scraping.
Spec: [F007](02-features/F007-sugestoes-video-funil.md).

## Ideias futuras (sem spec ainda — avaliar antes de virar feature)
- **Diagnóstico de design/UI/UX via IA**: abrir o site do Lead (screenshot
  via browser headless), enviar a imagem à Claude API com visão e avaliar
  design, UI e UX. O resultado alimentaria novas Dores (ex.:
  `DESIGN_DESATUALIZADO`) e tornaria o score mais robusto. Exige: novo
  tipo de Dor no domain model, ADR pra lib de screenshot (Playwright ou
  similar) e contrato da Claude API. Custo estimado: centavos por análise
  (1 screenshot + structured output), compatível com o teto de R$50/mês.

## Pilar de leitura — dashboard de funil (F010)
A home (`/`) é um **dashboard de funil read-only**: mostra a distribuição dos
Leads por estágio, as taxas de conversão entre estágios e os painéis de ação
(Leads que exigem atenção, follow-up pendente). É **derivado do estado atual**
do banco — sem event log, sem nova infra (ADR-002). Spec:
[F010](02-features/F010-dashboard-funil.md). Métricas que exigem histórico de
eventos (SLA de 1ª resposta, conversão no tempo, CAC, top objeções) permanecem
fora de escopo até existir captura desses dados.

## Fora de escopo na Fase 1
- Multi-tenant / multi-usuário
- Envio automático de mensagens (WhatsApp/email API)
- App mobile
- Analytics **histórico/temporal** do funil: SLA de 1ª resposta, conversão ao
  longo do tempo, CAC, top objeções — exigem event log / campos de evento que
  não existem na Fase 1 (o dashboard read-only da F010 **está** em escopo)
- Integração com CRM externo (HubSpot, Pipedrive)
- Scraping fora do Google Places
- Enriquecimento via LinkedIn, Receita Federal, etc.
- Workers, filas, jobs agendados
