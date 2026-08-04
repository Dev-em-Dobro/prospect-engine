// F022 / ADR-014 — PDF cliente-facing da Proposta (pdf-lib + Source Sans 3).

import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type ItemEscopoPdf = { item: string; descricao: string };

export type DadosPdfProposta = {
  nomeNegocio: string;
  resumo: string;
  escopo: ItemEscopoPdf[];
  entregaveis: string[];
  prazoEstimado: string;
  faixaMin: number;
  faixaMax: number;
  observacoes?: string;
};

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COR = {
  fundo: rgb(0.965, 0.961, 0.945), // #F6F5F1
  faixa: rgb(0.133, 0.773, 0.369), // primary #22c55e
  faixaEscura: rgb(0.09, 0.45, 0.25),
  titulo: rgb(0.12, 0.14, 0.16),
  corpo: rgb(0.22, 0.24, 0.27),
  muted: rgb(0.45, 0.48, 0.52),
  card: rgb(1, 1, 1),
  cardBorda: rgb(0.88, 0.89, 0.9),
};

function milhar(v: number): string {
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Normaliza pontuação tipográfica; com fonte embutida os acentos PT-BR
 * passam direto — só limpamos chars que quebram o draw.
 */
export function paraWinAnsi(texto: string): string {
  return texto
    .replace(/[\u2014\u2015]/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2022\u2023\u25E6]/g, "-");
}

/** Quebra texto em linhas por largura em pontos (fonte embutida). */
export function quebrarLinhasPorLargura(
  texto: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const safe = paraWinAnsi(texto);
  const linhas: string[] = [];
  for (const bruto of safe.split("\n")) {
    if (bruto.length === 0) {
      linhas.push("");
      continue;
    }
    const palavras = bruto.split(/\s+/);
    let atual = "";
    for (const p of palavras) {
      const candidato = atual ? `${atual} ${p}` : p;
      if (font.widthOfTextAtSize(candidato, size) <= maxWidth) {
        atual = candidato;
      } else {
        if (atual) linhas.push(atual);
        if (font.widthOfTextAtSize(p, size) <= maxWidth) {
          atual = p;
        } else {
          // palavra mais larga que a coluna: corta duro
          let resto = p;
          while (resto.length > 0) {
            let i = resto.length;
            while (
              i > 1 &&
              font.widthOfTextAtSize(resto.slice(0, i), size) > maxWidth
            ) {
              i -= 1;
            }
            linhas.push(resto.slice(0, i));
            resto = resto.slice(i);
          }
          atual = "";
        }
      }
    }
    if (atual) linhas.push(atual);
  }
  return linhas;
}

/** Compat: quebra por chars (testes / callers legados). */
export function quebrarLinhas(texto: string, maxChars = 90): string[] {
  const linhas: string[] = [];
  for (const bruto of paraWinAnsi(texto).split("\n")) {
    if (bruto.length === 0) {
      linhas.push("");
      continue;
    }
    let resto = bruto;
    while (resto.length > maxChars) {
      let corte = resto.lastIndexOf(" ", maxChars);
      if (corte < 40) corte = maxChars;
      linhas.push(resto.slice(0, corte));
      resto = resto.slice(corte).trimStart();
    }
    if (resto) linhas.push(resto);
  }
  return linhas;
}

async function carregarFontes(doc: PDFDocument) {
  doc.registerFontkit(fontkit);
  const dir = path.join(process.cwd(), "assets", "fonts", "proposta");
  const [regularBytes, semiboldBytes] = await Promise.all([
    readFile(path.join(dir, "SourceSans3-Regular.ttf")),
    readFile(path.join(dir, "SourceSans3-Semibold.ttf")),
  ]);
  const regular = await doc.embedFont(regularBytes);
  const semibold = await doc.embedFont(semiboldBytes);
  return { regular, semibold };
}

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  semibold: PDFFont;
};

function novaPagina(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: COR.fundo,
  });
  // faixa lateral esquerda
  ctx.page.drawRectangle({
    x: 0,
    y: 0,
    width: 8,
    height: PAGE_H,
    color: COR.faixa,
  });
  ctx.y = PAGE_H - MARGIN;
}

function garantirEspaco(ctx: Ctx, precisa: number) {
  if (ctx.y - precisa < MARGIN) {
    novaPagina(ctx);
  }
}

function desenharTexto(
  ctx: Ctx,
  text: string,
  opts: {
    font: PDFFont;
    size: number;
    color: ReturnType<typeof rgb>;
    x?: number;
    maxWidth?: number;
    lineHeight?: number;
  },
) {
  const x = opts.x ?? MARGIN;
  const maxWidth = opts.maxWidth ?? CONTENT_W;
  const lineHeight = opts.lineHeight ?? opts.size * 1.35;
  const linhas = quebrarLinhasPorLargura(text, opts.font, opts.size, maxWidth);
  for (const linha of linhas) {
    garantirEspaco(ctx, lineHeight);
    if (linha) {
      ctx.page.drawText(linha, {
        x,
        y: ctx.y,
        size: opts.size,
        font: opts.font,
        color: opts.color,
      });
    }
    ctx.y -= lineHeight;
  }
}

function secaoTitulo(ctx: Ctx, label: string) {
  garantirEspaco(ctx, 28);
  ctx.y -= 6;
  desenharTexto(ctx, label.toUpperCase(), {
    font: ctx.semibold,
    size: 9,
    color: COR.faixaEscura,
    lineHeight: 14,
  });
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y + 4,
    width: 36,
    height: 2,
    color: COR.faixa,
  });
  ctx.y -= 8;
}

export async function montarPdfProposta(
  dados: DadosPdfProposta,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const { regular, semibold } = await carregarFontes(doc);
  const ctx: Ctx = {
    doc,
    page: doc.addPage([PAGE_W, PAGE_H]),
    y: PAGE_H - MARGIN,
    regular,
    semibold,
  };
  // reusa helper de fundo
  ctx.page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: COR.fundo,
  });
  ctx.page.drawRectangle({
    x: 0,
    y: 0,
    width: 8,
    height: PAGE_H,
    color: COR.faixa,
  });

  // Cabeçalho
  desenharTexto(ctx, "PROPOSTA COMERCIAL", {
    font: semibold,
    size: 10,
    color: COR.faixaEscura,
    lineHeight: 14,
  });
  ctx.y -= 4;
  desenharTexto(ctx, dados.nomeNegocio, {
    font: semibold,
    size: 22,
    color: COR.titulo,
    lineHeight: 28,
  });
  ctx.y -= 10;

  // Card resumo
  const resumoLinhas = quebrarLinhasPorLargura(
    dados.resumo,
    regular,
    11,
    CONTENT_W - 28,
  );
  const cardH = Math.max(56, resumoLinhas.length * 16 + 28);
  garantirEspaco(ctx, cardH + 12);
  const cardY = ctx.y - cardH + 14;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: cardY,
    width: CONTENT_W,
    height: cardH,
    color: COR.card,
    borderColor: COR.cardBorda,
    borderWidth: 1,
  });
  ctx.y -= 16;
  for (const linha of resumoLinhas) {
    ctx.page.drawText(linha, {
      x: MARGIN + 14,
      y: ctx.y,
      size: 11,
      font: regular,
      color: COR.corpo,
    });
    ctx.y -= 16;
  }
  ctx.y = cardY - 18;

  if (dados.escopo.length > 0) {
    secaoTitulo(ctx, "Escopo");
    for (const item of dados.escopo) {
      garantirEspaco(ctx, 36);
      desenharTexto(ctx, item.item, {
        font: semibold,
        size: 11,
        color: COR.titulo,
        lineHeight: 15,
      });
      desenharTexto(ctx, item.descricao, {
        font: regular,
        size: 10.5,
        color: COR.corpo,
        lineHeight: 14,
      });
      ctx.y -= 6;
    }
  }

  if (dados.entregaveis.length > 0) {
    secaoTitulo(ctx, "Você recebe");
    for (const e of dados.entregaveis) {
      desenharTexto(ctx, `- ${e}`, {
        font: regular,
        size: 10.5,
        color: COR.corpo,
        lineHeight: 15,
      });
    }
    ctx.y -= 4;
  }

  secaoTitulo(ctx, "Prazo estimado");
  desenharTexto(ctx, dados.prazoEstimado, {
    font: regular,
    size: 11,
    color: COR.corpo,
    lineHeight: 15,
  });

  // Investimento
  secaoTitulo(ctx, "Investimento sugerido");
  const faixa = `R$ ${milhar(dados.faixaMin)} - R$ ${milhar(dados.faixaMax)}`;
  garantirEspaco(ctx, 48);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 28,
    width: CONTENT_W,
    height: 40,
    color: rgb(0.9, 0.97, 0.92),
    borderColor: COR.faixa,
    borderWidth: 1,
  });
  ctx.page.drawText(faixa, {
    x: MARGIN + 14,
    y: ctx.y - 18,
    size: 16,
    font: semibold,
    color: COR.faixaEscura,
  });
  ctx.y -= 52;

  if (dados.observacoes?.trim()) {
    secaoTitulo(ctx, "Observações");
    desenharTexto(ctx, dados.observacoes.trim(), {
      font: regular,
      size: 10.5,
      color: COR.muted,
      lineHeight: 14,
    });
  }

  // rodapé na última página
  ctx.page.drawText("Documento gerado para envio comercial", {
    x: MARGIN,
    y: 28,
    size: 8,
    font: regular,
    color: COR.muted,
  });

  return doc.save();
}
