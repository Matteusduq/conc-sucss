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
