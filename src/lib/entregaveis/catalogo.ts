// F020 — catálogo estático de entregáveis (Builders Club / Consultoria Freela).

const BASE = "https://entregaveis-psi.vercel.app";

export type Entregavel = {
  slug: string;
  titulo: string;
  descricao: string;
  url: string;
  /** false = aparece no menu lateral */
  emBreve?: boolean;
};

export const ENTREGAVEIS: Entregavel[] = [
  {
    slug: "arsenal-sites",
    titulo: "Arsenal de sites",
    descricao:
      "12 templates por nicho. Abre, troca os dados do cliente e publica em minutos.",
    url: `${BASE}/01-SITES-PRONTOS/index.html`,
  },
  {
    slug: "prompts",
    titulo: "Biblioteca de prompts",
    descricao:
      "Prompt-mestre para gerar site novo do zero, mais prompts de copy e performance.",
    url: `${BASE}/02-PROMPTS/index.html`,
  },
  {
    slug: "portfolio",
    titulo: "Seu portfólio pronto",
    descricao:
      "Página pronta para mostrar nas abordagens. Troca nome, cidade e WhatsApp.",
    url: `${BASE}/04-PORTFOLIO/index.html`,
  },
  {
    slug: "contrato",
    titulo: "Modelo de contrato",
    descricao:
      "Contrato para projetos simples: sinal, garantia e escopo fora cobrado à parte.",
    url: `${BASE}/05-CONTRATO/index.html`,
  },
  {
    slug: "scripts-venda",
    titulo: "Scripts de venda",
    descricao:
      "Do primeiro oi ao contrato: abertura, follow-up, objeção e fechamento.",
    url: `${BASE}/06-SCRIPTS-VENDA/index.html`,
  },
  {
    slug: "setup-orion",
    titulo: "Setup do Orion",
    descricao:
      "Guia para destravar a chave Google (Places e PageSpeed) e resolver erros comuns.",
    url: `${BASE}/07-SETUP-ORION/index.html`,
  },
  {
    slug: "briefing",
    titulo: "Briefing do cliente",
    descricao:
      "Formulário para levantar tudo antes de codar e evitar retrabalho.",
    url: `${BASE}/08-BRIEFING/index.html`,
  },
  {
    slug: "precificacao",
    titulo: "Precificação",
    descricao:
      "Faixas de referência para site, landing, bot e manutenção mensal.",
    url: `${BASE}/09-PRECIFICACAO/index.html`,
  },
  {
    slug: "crm",
    titulo: "Modelo de CRM",
    descricao: "CRM para usar e revender — chegando nas próximas consultorias.",
    url: "#",
    emBreve: true,
  },
  {
    slug: "cms",
    titulo: "Modelo de CMS",
    descricao: "Painel para o cliente editar o site — chegando em breve.",
    url: "#",
    emBreve: true,
  },
  {
    slug: "agentes-whatsapp",
    titulo: "Agentes no WhatsApp",
    descricao: "Tutorial de agente conectado ao WhatsApp — chegando em breve.",
    url: "#",
    emBreve: true,
  },
];

export const ENTREGAVEIS_MENU = ENTREGAVEIS.filter((e) => !e.emBreve);

export function entregavelPorSlug(slug: string): Entregavel | undefined {
  return ENTREGAVEIS.find((e) => e.slug === slug);
}
