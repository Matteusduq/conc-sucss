import { describe, it, expect } from 'vitest';
import { normalizeRects, denormalizeRect, validateSelection } from '../highlights';
import { extractAnchorContext, reanchorHighlight } from '../text-anchor';

describe('PDF Highlights & Anchoring Utilities (Points 8-13)', () => {
  // Ponto 8: normalização e desnormalização de retângulos
  it('8. normaliza e desnormaliza retângulos relativos à página com precisão', () => {
    const pageRect = { left: 100, top: 200, width: 800, height: 1000 } as DOMRect;
    const clientRects = [
      { left: 180, top: 250, width: 400, height: 20 } as DOMRect,
      { left: 180, top: 270, width: 350, height: 20 } as DOMRect,
    ];

    const normalized = normalizeRects(clientRects, pageRect);
    expect(normalized).toHaveLength(2);

    // Primeiro retângulo: x = (180-100)/800 = 0.1, y = (250-200)/1000 = 0.05
    expect(normalized[0].x).toBeCloseTo(0.1, 4);
    expect(normalized[0].y).toBeCloseTo(0.05, 4);
    expect(normalized[0].width).toBeCloseTo(0.5, 4);
    expect(normalized[0].height).toBeCloseTo(0.02, 4);

    // Desnormalização de volta
    const denorm = denormalizeRect(normalized[0], 800, 1000);
    expect(denorm.left).toBeCloseTo(80, 2);
    expect(denorm.top).toBeCloseTo(50, 2);
    expect(denorm.width).toBeCloseTo(400, 2);
    expect(denorm.height).toBeCloseTo(20, 2);
  });

  // Ponto 8b: mesclagem de retângulos na mesma linha e preservação de múltiplas linhas
  it('8b. mescla fragmentos adjacentes na mesma linha e preserva múltiplas linhas distintas', () => {
    const pageRect = { left: 0, top: 0, width: 1000, height: 1000 } as DOMRect;
    // Dois fragmentos na mesma linha (y=100) e um na linha seguinte (y=130)
    const clientRects = [
      { left: 100, top: 100, width: 150, height: 20 } as DOMRect, // Span 1 linha 1
      { left: 250, top: 100, width: 200, height: 20 } as DOMRect, // Span 2 linha 1 (toca o span 1)
      { left: 100, top: 130, width: 300, height: 20 } as DOMRect, // Linha 2
    ];

    const normalized = normalizeRects(clientRects, pageRect);
    // Deve resultar em exatamente 2 retângulos: 1 unificado para a linha 1 e 1 para a linha 2
    expect(normalized).toHaveLength(2);

    // Linha 1 mesclada: x=0.1, y=0.1, width=0.35 (150+200)/1000, height=0.02
    expect(normalized[0].x).toBeCloseTo(0.1, 4);
    expect(normalized[0].y).toBeCloseTo(0.1, 4);
    expect(normalized[0].width).toBeCloseTo(0.35, 4);
    expect(normalized[0].height).toBeCloseTo(0.02, 4);

    // Linha 2 separada: x=0.1, y=0.13, width=0.3, height=0.02
    expect(normalized[1].x).toBeCloseTo(0.1, 4);
    expect(normalized[1].y).toBeCloseTo(0.13, 4);
    expect(normalized[1].width).toBeCloseTo(0.3, 4);
    expect(normalized[1].height).toBeCloseTo(0.02, 4);
  });

  // Ponto 9: seleção vazia ou fora de container
  it('9. rejeita seleção vazia ou de apenas espaços em branco', () => {
    const mockPageElement = {
      contains: () => true,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 1000 } as DOMRect),
    } as unknown as HTMLElement;

    const emptySelection = {
      isCollapsed: true,
      rangeCount: 0,
      toString: () => '',
    } as unknown as Selection;

    const resEmpty = validateSelection(emptySelection, mockPageElement);
    expect(resEmpty.valid).toBe(false);

    const whitespaceSelection = {
      isCollapsed: false,
      rangeCount: 1,
      toString: () => '   \n  \t ',
    } as unknown as Selection;

    const resWhitespace = validateSelection(whitespaceSelection, mockPageElement);
    expect(resWhitespace.valid).toBe(false);
  });

  // Ponto 10: limite de tamanho mínimo e máximo
  it('10. valida limites de tamanho mínimo (>=5) e máximo (<=2000)', () => {
    const mockNode = {} as Node;
    const mockPageElement = {
      contains: () => true,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 1000 } as DOMRect),
    } as unknown as HTMLElement;

    // Texto curto (< 5 chars)
    const shortSelection = {
      isCollapsed: false,
      rangeCount: 1,
      toString: () => '1234',
      getRangeAt: () => ({
        startContainer: mockNode,
        endContainer: mockNode,
        getClientRects: () => [{ left: 10, top: 10, width: 50, height: 10 }] as unknown as DOMRectList,
      }),
    } as unknown as Selection;

    const resShort = validateSelection(shortSelection, mockPageElement);
    expect(resShort.valid).toBe(false);
    expect(resShort.error).toContain('pelo menos 5 caracteres');

    // Texto longo (> 2000 chars)
    const longText = 'A'.repeat(2005);
    const longSelection = {
      isCollapsed: false,
      rangeCount: 1,
      toString: () => longText,
      getRangeAt: () => ({
        startContainer: mockNode,
        endContainer: mockNode,
        getClientRects: () => [{ left: 10, top: 10, width: 50, height: 10 }] as unknown as DOMRectList,
      }),
    } as unknown as Selection;

    const resLong = validateSelection(longSelection, mockPageElement);
    expect(resLong.valid).toBe(false);
    expect(resLong.error).toContain('excede o limite máximo de 2.000 caracteres');

    // Texto válido (ex: 20 chars)
    const validSelection = {
      isCollapsed: false,
      rangeCount: 1,
      toString: () => 'O processo legislativo compreende...',
      getRangeAt: () => ({
        startContainer: mockNode,
        endContainer: mockNode,
        getClientRects: () => [{ left: 10, top: 10, width: 100, height: 15 }] as unknown as DOMRectList,
      }),
    } as unknown as Selection;

    const resValid = validateSelection(validSelection, mockPageElement);
    expect(resValid.valid).toBe(true);
    expect(resValid.selectedText).toBe('O processo legislativo compreende...');
    expect(resValid.rects).toBeDefined();
  });

  // Ponto 11: geração de prefix/suffix e contexto local
  it('11. extrai prefixo, sufixo e contexto local ao redor da seleção', () => {
    const fullText =
      'Art. 59. O processo legislativo compreende a elaboração de: I - emendas à Constituição; II - leis complementares; III - leis ordinárias. Parágrafo único.';
    const selected = 'I - emendas à Constituição;';

    const anchor = extractAnchorContext(fullText, selected);
    expect(anchor.quotePrefix).toContain('compreende a elaboração de: ');
    expect(anchor.quoteSuffix).toContain('II - leis complementares;');
    expect(anchor.contextBefore).toContain('O processo legislativo');
    expect(anchor.contextAfter).toContain('leis ordinárias');
    expect(anchor.startOffset).toBeGreaterThan(0);
    expect(anchor.endOffset).toBe(anchor.startOffset + selected.length);
  });

  // Ponto 12: reancoragem determinística por texto e prefixo/sufixo
  it('12. reancora highlight com correspondência única após atualização do PDF', () => {
    const updatedPageText =
      'Capítulo I. Art. 59. O processo legislativo compreende a elaboração de: I - emendas à Constituição; II - leis complementares.';

    const result = reanchorHighlight({
      pageText: updatedPageText,
      selectedText: 'I - emendas à Constituição;',
      quotePrefix: 'compreende a elaboração de: ',
      quoteSuffix: ' II - leis complementares.',
    });

    expect(result.found).toBe(true);
    expect(result.isAmbiguous).toBe(false);
    expect(result.startOffset).toBeGreaterThan(0);
    expect(result.endOffset).toBe(result.startOffset! + 'I - emendas à Constituição;'.length);
  });

  // Ponto 13: caso ambíguo não reposiciona incorretamente
  it('13. recusa reposicionamento quando o trecho for ambíguo ou inexistente', () => {
    const repeatedPageText =
      'Quórum: maioria absoluta. Regra geral: maioria absoluta. Exceção: maioria absoluta.';

    // Sem prefixo nem sufixo discriminatório em texto com múltiplas ocorrências
    const ambiguousResult = reanchorHighlight({
      pageText: repeatedPageText,
      selectedText: 'maioria absoluta',
      quotePrefix: null,
      quoteSuffix: null,
    });

    expect(ambiguousResult.isAmbiguous).toBe(true);
    expect(ambiguousResult.found).toBe(false);
    expect(ambiguousResult.message).toBe('Esta marcação precisa ser revisada após a atualização do PDF.');

    // Texto que não existe mais na nova versão
    const notFoundResult = reanchorHighlight({
      pageText: repeatedPageText,
      selectedText: 'quórum qualificado de dois terços',
    });

    expect(notFoundResult.found).toBe(false);
    expect(notFoundResult.startOffset).toBeNull();
    expect(notFoundResult.message).toBe('Esta marcação precisa ser revisada após a atualização do PDF.');
  });
});

