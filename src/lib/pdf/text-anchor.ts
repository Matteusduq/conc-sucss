/**
 * Utilitários para ancoragem robusta e determinística de trechos de texto em PDFs.
 * Suporta tolerância a quebras de linha e reancoragem após atualização de versão.
 */

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export interface ExtractedAnchorContext {
  quotePrefix: string;
  quoteSuffix: string;
  startOffset: number;
  endOffset: number;
  contextBefore: string;
  contextAfter: string;
}

/**
 * Localiza o trecho selecionado dentro do texto completo da página e extrai contextos.
 */
export function extractAnchorContext(
  fullPageText: string,
  selectedText: string,
  prefixLength: number = 32,
  suffixLength: number = 32,
  contextLength: number = 400
): ExtractedAnchorContext {
  const normPage = normalizeWhitespace(fullPageText);
  const normSelected = normalizeWhitespace(selectedText);

  let startOffset = normPage.indexOf(normSelected);
  if (startOffset === -1) {
    // Tenta busca insensível a maiúsculas/minúsculas se não encontrar exato
    startOffset = normPage.toLowerCase().indexOf(normSelected.toLowerCase());
  }

  const endOffset = startOffset !== -1 ? startOffset + normSelected.length : -1;

  let quotePrefix = '';
  let quoteSuffix = '';
  let contextBefore = '';
  let contextAfter = '';

  if (startOffset !== -1) {
    const prefStart = Math.max(0, startOffset - prefixLength);
    quotePrefix = normPage.slice(prefStart, startOffset);

    const suffEnd = Math.min(normPage.length, endOffset + suffixLength);
    quoteSuffix = normPage.slice(endOffset, suffEnd);

    const ctxBeforeStart = Math.max(0, startOffset - contextLength);
    contextBefore = normPage.slice(ctxBeforeStart, startOffset);

    const ctxAfterEnd = Math.min(normPage.length, endOffset + contextLength);
    contextAfter = normPage.slice(endOffset, ctxAfterEnd);
  } else {
    // Fallback: se o texto exato não for achado na string completa
    quotePrefix = normSelected.slice(0, Math.min(prefixLength, normSelected.length));
    quoteSuffix = normSelected.slice(Math.max(0, normSelected.length - suffixLength));
    contextBefore = '';
    contextAfter = '';
  }

  return {
    quotePrefix,
    quoteSuffix,
    startOffset: startOffset !== -1 ? startOffset : 0,
    endOffset: endOffset !== -1 ? endOffset : normSelected.length,
    contextBefore,
    contextAfter,
  };
}

export interface ReanchorResult {
  reanchored: boolean;
  found: boolean;
  newStartOffset?: number;
  startOffset: number | null;
  endOffset: number | null;
  isAmbiguous: boolean;
  message?: string;
}

/**
 * Tenta reancorar deterministicamente uma marcação quando o PDF muda de versão.
 */
export function reanchorHighlight(params: {
  fullPageText?: string;
  pageText?: string;
  selectedText: string;
  quotePrefix?: string | null;
  quoteSuffix?: string | null;
}): ReanchorResult {
  const rawPageText = params.fullPageText || params.pageText || '';
  const normPage = normalizeWhitespace(rawPageText);
  const normSelected = normalizeWhitespace(params.selectedText || '');

  if (!normSelected) {
    return {
      reanchored: false,
      found: false,
      startOffset: null,
      endOffset: null,
      isAmbiguous: false,
      message: 'Trecho selecionado vazio ou inválido.',
    };
  }

  // 1. Tentar busca com prefixo + texto + sufixo se disponíveis
  const prefix = params.quotePrefix ? normalizeWhitespace(params.quotePrefix) : '';
  const suffix = params.quoteSuffix ? normalizeWhitespace(params.quoteSuffix) : '';

  if (prefix && suffix) {
    const searchPattern = `${prefix}${normSelected}${suffix}`;
    const occurrences: number[] = [];
    let idx = normPage.indexOf(searchPattern);
    while (idx !== -1) {
      occurrences.push(idx + prefix.length);
      idx = normPage.indexOf(searchPattern, idx + 1);
    }

    if (occurrences.length === 1) {
      const start = occurrences[0];
      return {
        reanchored: true,
        found: true,
        newStartOffset: start,
        startOffset: start,
        endOffset: start + normSelected.length,
        isAmbiguous: false,
      };
    }
  }

  // 2. Busca pelo texto selecionado isolado
  const occurrences: number[] = [];
  let idx = normPage.indexOf(normSelected);
  while (idx !== -1) {
    occurrences.push(idx);
    idx = normPage.indexOf(normSelected, idx + 1);
  }

  if (occurrences.length === 1) {
    const start = occurrences[0];
    return {
      reanchored: true,
      found: true,
      newStartOffset: start,
      startOffset: start,
      endOffset: start + normSelected.length,
      isAmbiguous: false,
    };
  }

  if (occurrences.length > 1) {
    return {
      reanchored: false,
      found: false,
      startOffset: null,
      endOffset: null,
      isAmbiguous: true,
      message: 'Esta marcação precisa ser revisada após a atualização do PDF.',
    };
  }

  return {
    reanchored: false,
    found: false,
    startOffset: null,
    endOffset: null,
    isAmbiguous: false,
    message: 'Esta marcação precisa ser revisada após a atualização do PDF.',
  };
}
