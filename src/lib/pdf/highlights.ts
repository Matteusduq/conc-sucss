import { HighlightRect } from '@/types/database';

export interface SelectionValidationResult {
  valid: boolean;
  isValid?: boolean;
  error?: string;
  selectedText?: string;
  range?: Range;
  rects?: HighlightRect[];
  clientRect?: DOMRect;
}

/**
 * Normaliza os retângulos de seleção do DOM para proporções relativas (0..1)
 * da página, permitindo escalar perfeitamente com zoom e redimensionamento.
 */
export function normalizeRects(
  clientRects: DOMRectList | DOMRect[],
  pageRect: DOMRect
): HighlightRect[] {
  if (!pageRect.width || !pageRect.height) return [];

  const rects: HighlightRect[] = [];
  const rectArray = Array.from(clientRects);

  for (const rect of rectArray) {
    if (rect.width <= 0 || rect.height <= 0) continue;

    const x = Math.max(0, Math.min(1, (rect.left - pageRect.left) / pageRect.width));
    const y = Math.max(0, Math.min(1, (rect.top - pageRect.top) / pageRect.height));
    const width = Math.min(1 - x, rect.width / pageRect.width);
    const height = Math.min(1 - y, rect.height / pageRect.height);

    if (width > 0.001 && height > 0.001) {
      rects.push({
        x: Number(x.toFixed(5)),
        y: Number(y.toFixed(5)),
        width: Number(width.toFixed(5)),
        height: Number(height.toFixed(5)),
      });
    }
  }

  return rects;
}

/**
 * Desnormaliza as coordenadas relativas (0..1) de volta para pixels atuais do container
 */
export function denormalizeRect(
  rect: HighlightRect,
  pageDimensionsOrWidth: number | { width: number; height: number },
  heightArg?: number
): { left: number; top: number; width: number; height: number } {
  const width =
    typeof pageDimensionsOrWidth === 'number'
      ? pageDimensionsOrWidth
      : pageDimensionsOrWidth.width;
  const height =
    typeof pageDimensionsOrWidth === 'number'
      ? (heightArg ?? 0)
      : pageDimensionsOrWidth.height;

  return {
    left: rect.x * width,
    top: rect.y * height,
    width: rect.width * width,
    height: rect.height * height,
  };
}

/**
 * Valida a seleção do usuário contra as regras:
 * 1. Não vazia;
 * 2. Pertence à text layer da página atual;
 * 3. Não cruza múltiplas páginas;
 * 4. Respeita limites: mínimo ~5 caracteres, máximo ~2000 caracteres.
 */
export function validateSelection(
  selectionOrRange: Selection | Range | null,
  pageElement: HTMLElement | null
): SelectionValidationResult {
  if (!selectionOrRange) {
    return { valid: false, isValid: false };
  }

  let range: Range;
  let rawText: string;

  if ('getRangeAt' in selectionOrRange) {
    if (selectionOrRange.isCollapsed || selectionOrRange.rangeCount === 0) {
      return { valid: false, isValid: false };
    }
    range = selectionOrRange.getRangeAt(0);
    rawText = selectionOrRange.toString();
  } else {
    range = selectionOrRange;
    rawText = range.toString();
  }

  const selectedText = rawText.trim();

  if (selectedText.length < 5) {
    return {
      valid: false,
      isValid: false,
      error: 'Selecione um trecho com pelo menos 5 caracteres.',
    };
  }

  if (selectedText.length > 2000) {
    return {
      valid: false,
      isValid: false,
      error: 'O trecho selecionado excede o limite máximo de 2.000 caracteres para IA.',
    };
  }

  // Validação de contêiner da página
  if (pageElement) {
    const isStartInPage = pageElement.contains(range.startContainer);
    const isEndInPage = pageElement.contains(range.endContainer);

    if (!isStartInPage && !isEndInPage) {
      return { valid: false, isValid: false, error: 'A seleção deve ser feita dentro do documento.' };
    }

    if (!isStartInPage || !isEndInPage) {
      return {
        valid: false,
        isValid: false,
        error: 'MULTI_PAGE',
      };
    }

    const pageRect = pageElement.getBoundingClientRect();
    const rawRects = typeof range.getClientRects === 'function' ? range.getClientRects() : [];
    const rects = normalizeRects(rawRects, pageRect);
    const clientRect =
      typeof range.getBoundingClientRect === 'function'
        ? range.getBoundingClientRect()
        : (rawRects[0] ?? { left: 0, top: 0, width: 0, height: 0 } as DOMRect);

    return {
      valid: true,
      isValid: true,
      selectedText,
      range,
      rects,
      clientRect,
    };
  }

  return {
    valid: true,
    isValid: true,
    selectedText,
    range,
    clientRect:
      typeof range.getBoundingClientRect === 'function'
        ? range.getBoundingClientRect()
        : ({ left: 0, top: 0, width: 0, height: 0 } as DOMRect),
  };
}

/**
 * Localiza nós de texto no textLayer correspondentes ao texto selecionado e
 * gera retângulos normalizados para reancoragem após atualização de versão.
 */
export function findDomRectsForText(
  container: HTMLElement,
  selectedText: string,
  startCharIndex?: number
): HighlightRect[] | null {
  if (typeof window === 'undefined' || !container || !selectedText) return null;

  const textLayer =
    container.querySelector('.react-pdf__Page__textContent') ||
    container.querySelector('.react-pdf__Page__textLayer') ||
    container;

  const textNodes: { node: Node; start: number; end: number }[] = [];
  const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
  let fullStr = '';
  let n = walker.nextNode();
  while (n) {
    const val = n.nodeValue || '';
    if (val.length > 0) {
      textNodes.push({ node: n, start: fullStr.length, end: fullStr.length + val.length });
      fullStr += val;
    }
    n = walker.nextNode();
  }

  if (fullStr.length === 0) return null;

  let matchIndex = -1;
  if (typeof startCharIndex === 'number' && startCharIndex >= 0) {
    matchIndex = fullStr.indexOf(selectedText, Math.max(0, startCharIndex - 20));
  }
  if (matchIndex === -1) {
    matchIndex = fullStr.indexOf(selectedText);
  }
  if (matchIndex === -1) {
    matchIndex = fullStr.toLowerCase().indexOf(selectedText.toLowerCase());
  }

  if (matchIndex === -1) return null;

  const matchEnd = matchIndex + selectedText.length;
  let startNode: Node | null = null;
  let startNodeOffset = 0;
  let endNode: Node | null = null;
  let endNodeOffset = 0;

  for (const item of textNodes) {
    if (!startNode && matchIndex >= item.start && matchIndex < item.end) {
      startNode = item.node;
      startNodeOffset = matchIndex - item.start;
    }
    if (matchEnd > item.start && matchEnd <= item.end) {
      endNode = item.node;
      endNodeOffset = matchEnd - item.start;
      break;
    }
  }

  if (startNode && endNode) {
    try {
      const range = document.createRange();
      range.setStart(startNode, startNodeOffset);
      range.setEnd(endNode, endNodeOffset);
      const pageRect = container.getBoundingClientRect();
      const rawRects = range.getClientRects();
      if (rawRects.length > 0) {
        return normalizeRects(rawRects, pageRect);
      }
    } catch {
      return null;
    }
  }

  return null;
}

