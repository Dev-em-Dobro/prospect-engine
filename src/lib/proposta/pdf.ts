// F022 / ADR-014 — monta PDF simples da Proposta (pdf-lib).

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type DadosPdfProposta = {
  nomeNegocio: string;
  versao: number;
  texto: string;
};

/** Quebra texto em linhas respeitando largura aproximada (Helvetica 11). */
export function quebrarLinhas(texto: string, maxChars = 90): string[] {
  const linhas: string[] = [];
  for (const bruto of texto.split("\n")) {
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

export async function montarPdfProposta(
  dados: DadosPdfProposta,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const maxWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const titleSize = 16;
  const lineHeight = 16;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const draw = (text: string, opts?: { bold?: boolean; size?: number }) => {
    const size = opts?.size ?? fontSize;
    const f = opts?.bold ? fontBold : font;
    if (y < margin + lineHeight) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    // pdf-lib WinAnsi: remove chars fora do subset básico
    const safe = text.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
    page.drawText(safe, {
      x: margin,
      y,
      size,
      font: f,
      color: rgb(0.1, 0.1, 0.12),
      maxWidth,
    });
    y -= opts?.size ? opts.size + 8 : lineHeight;
  };

  draw(`Proposta v${dados.versao} — ${dados.nomeNegocio}`, {
    bold: true,
    size: titleSize,
  });
  y -= 8;

  for (const linha of quebrarLinhas(dados.texto, 88)) {
    draw(linha || " ");
  }

  return doc.save();
}
