# Regras de Negócio e Engenharia Pedagógica — Sistema de Estudos Câmara dos Deputados

## 1. Princípio Central do Produto
O sistema opera como um centro de comando pessoal para o concurso da **Câmara dos Deputados — Analista Legislativo (Registro e Redação)**, cuja prova está prevista para **17 de janeiro de 2027**.

> **Diretriz Mestra:**
> A prioridade inicial vem da importância do conteúdo no edital e na engenharia reversa da banca Cebraspe.
> A prioridade diária passa a ser ajustada pelo desempenho real do usuário.

1. O edital e a engenharia reversa Cebraspe/Câmara (2021–2026) definem onde começar;
2. O desempenho do usuário altera continuamente a ordem dos estudos;
3. Assuntos importantes e fracos sobem na fila diária;
4. Assuntos importantes e já dominados entram em manutenção preventiva;
5. Assuntos pouco importantes (LOW) não consomem tempo desproporcional;
6. Questões continuam sendo feitas fora do sistema, no TEC Concursos;
7. Prova Discursiva (P3) é avaliada em módulo próprio com métricas de redação técnica e penalização gramatical oficial.

---

## 2. Modelagem do Edital: Unidade Prática (`Topic`) vs. Item Oficial (`SyllabusItem`)

O sistema separa estritamente a granularidade normativa do edital da unidade pedagógica de estudo:

- **`SyllabusItem` (Item Oficial do Edital):**
  Preserva na íntegra a redação e hierarquia oficial divulgada pela Câmara dos Deputados (ex: *8.2 Tipos de gráficos: histograma, linha, barra, dispersão, box plot*). Não é transformado em um arquivo PDF individual para cada linha ou subtópico.
  
- **`Topic` (Unidade Prática de Estudo):**
  Agrupa um ou mais `SyllabusItem` correlatos em uma unidade temática didática consistente (ex: *Visualização e storytelling de dados*).
  
- **Regra de Materiais:**
  Existe exatamente **1 material/PDF para cada `Topic`**. Isso impede a proliferação caótica de dezenas de microarquivos isolados para microitens como "Histograma" ou "Box plot".

---

## 3. Avaliação Objetiva ($P_1$ e $P_2$) vs. Avaliação Discursiva ($P_3$)

- **Blocos Objetivos ($P_1$ e $P_2$):**
  Aferidos pelo `domain_score` (0–100), acurácia, pontuação líquida Cebraspe ($C - E$) e retenção FSRS.
  
- **Bloco Discursivo ($P_3$):**
  Não utiliza `domain_score` nem percentuais objetivos. Avaliado por sessões de treino com pontuação de conteúdo ($NC$), contagem de erros de língua portuguesa ($NE$) e linhas efetivamente escritas ($TL$), aplicando as fórmulas oficiais:
  - Questão de 20 linhas: $NQ_i = \max(0, NC_i - 3 \times \frac{NE_i}{TL_i})$ ($NC_i \le 15$);
  - Peça Técnica de 50 linhas: $NPT = \max(0, NC - 6 \times \frac{NE}{TL})$ ($NC \le 30$).

---

## 4. Prioridades de Prova e Formato Inicial de Estudo
Cada tópico do edital possui classificação de prioridade inicial:

| Prioridade | Formato de Material | Fluxo Obrigatório de Estudo |
| :--- | :--- | :--- |
| **HIGH** | PDF completo | PDF completo &rarr; questões no TEC &rarr; análise de desempenho &rarr; revisão &rarr; novas questões |
| **MEDIUM** | PDF simplificado | PDF simplificado &rarr; questões no TEC &rarr; revisão direcionada |
| **LOW** | Resumo | Resumo &rarr; questões no TEC &rarr; revisão somente se necessário |

**Regra inegociável:** Nenhum tópico é considerado consolidado apenas porque a leitura do PDF foi finalizada. Concluir o material gera status imediato `AWAITING_QUESTIONS` e recomendação de bateria no TEC Concursos.

---

## 3. Desempenho e Modelo Cebraspe (Certo / Errado)
A banca Cebraspe adota penalização em que **1 resposta errada anula 1 resposta certa**.

### 3.1. Fórmulas de Sessão
Para cada sessão realizada no TEC:
- $\text{answered} = \text{correct} + \text{wrong}$
- $\text{accuracy\_rate} = \frac{\text{correct}}{\text{answered}}$ (se $\text{answered} > 0$, senão 0)
- $\text{net\_points} = \text{correct} - \text{wrong}$
- $\text{net\_rate} = \frac{\text{correct} - \text{wrong}}{\text{total\_questions}}$

### 3.2. Performance Score Ponderado da Sessão
$$\text{accuracy\_component} = \text{accuracy\_rate} \times 100$$
$$\text{cebraspe\_net\_component} = \left(\frac{\text{net\_rate} + 1}{2}\right) \times 100$$
$$\text{session\_performance} = \text{accuracy\_component} \times 0.45 + \text{cebraspe\_net\_component} \times 0.55$$

As sessões são agregadas conferindo peso exponencial ou linear crescente às sessões mais recentes.

---

## 4. Domínio do Tópico (0–100)
Diferenciação conceitual obrigatória:
- **Cobertura:** percentual do material concluído;
- **Desempenho:** assertividade e pontuação líquida nas sessões TEC;
- **Retenção:** estabilidade e taxa de acerto nos flashcards FSRS;
- **Domínio:** índice composto de proficiência real.

### 4.1. Fórmula Base
$$\text{domain\_score} = \text{performance} \times 0.50 + \text{retention} \times 0.25 + \text{recency} \times 0.15 + \text{coverage} \times 0.10$$

### 4.2. Redistribuição de Pesos
Quando um componente não estiver disponível (ex: tópico novo sem flashcards criados), seus pesos são redistribuídos proporcionalmente entre os componentes existentes. A ausência de flashcards não força o domínio para baixo artificialmente.

### 4.3. Confiança do Domínio
Exibida sempre ao lado do domínio:
- **LOW:** menos de 20 questões OU apenas 1 sessão registrada;
- **MEDIUM:** 20 a 79 questões E pelo menos 2 sessões em dias distintos;
- **HIGH:** 80+ questões E pelo menos 3 sessões em dias distintos.

### 4.4. Faixas de Domínio
- `0–39`: FRACO
- `40–59`: EM CONSTRUÇÃO
- `60–74`: RAZOÁVEL
- `75–84`: BOM
- `85–94`: DOMINADO
- `95–100`: DOMÍNIO ALTO

---

## 5. Transições de Status do Tópico
1. `NOT_STARTED` &rarr; `LEARNING`: quando o usuário inicia a leitura do material;
2. `LEARNING` &rarr; `AWAITING_QUESTIONS`: quando conclui a leitura do material;
3. `AWAITING_QUESTIONS` &rarr; `CONSOLIDATING`: quando registra a primeira sessão TEC;
4. `CONSOLIDATING` &rarr; `MASTERED`: quando $\text{domain\_score} \ge 85$ E $\text{confidence} \ne \text{LOW}$;
5. `MASTERED` &rarr; `MAINTENANCE`: após período estável sem quedas relevantes;
6. Qualquer status &rarr; `AT_RISK`: quando tópico HIGH apresenta rendimento recente $< 65$, OU queda recente $\ge 15$ pontos, OU grande volume de flashcards vencidos.

---

## 6. Algoritmo "O Que Estudar Agora?" (Study Score 0–100)
Calculado para cada tópico para montar a fila de estudo:
$$\text{study\_score} = \text{priority} \times 0.35 + \text{mastery\_gap} \times 0.30 + \text{review\_urgency} \times 0.20 + \text{stage\_urgency} \times 0.10 + \text{confidence\_gap} \times 0.05$$

### Boosters Aplicados:
- $+10$ se HIGH e $\text{domain\_score} < 60$;
- $+10$ se duas sessões recentes $< 60$;
- $+8$ se HIGH e `NOT_STARTED`;
- $+8$ se revisão de flashcards muito atrasada ($> 5$ devidos);
- $+5$ se `AWAITING_QUESTIONS` há mais de 2 dias.

Clamp final: $0 \le \text{study\_score} \le 100$.

---

## 7. Repetição Espaçada FSRS (Priority-Aware)
- Biblioteca oficial: `ts-fsrs`;
- Retenção padrão: $0.90$ ($90\%$);
- Botões:
  - `1 = Errei` &rarr; AGAIN
  - `2 = Difícil` &rarr; HARD
  - `3 = Acertei` &rarr; GOOD
  - `4 = Muito fácil` &rarr; EASY
  - `Espaço` &rarr; Revelar resposta
- **Ordenação dos cartões devidos:**
  1. Cartões de Erro (`ERROR`);
  2. Tópicos de prioridade `HIGH`;
  3. Menor estabilidade (memória mais frágil);
  4. Maior atraso (mais vencido);
  5. Tópicos `MEDIUM`;
  6. Tópicos `LOW`.
- **Prevenção de escravidão ao backlog:** Teto recomendado de 25 min/dia para memória. Se houver mais cartões, não culpar o usuário e permitir seguir com questões e teoria.

---

## 8. Caderno de Erros Cognitivo
Taxonomia de falhas Cebraspe:
- `CONCEPT_CONFUSION`: Confusão entre conceitos correlatos;
- `COMPETENCE_SWAP`: Troca de competências regimentais/constitucionais;
- `ABSOLUTE_WORD_TRAP`: Pegadinha com "sempre", "nunca", "exclusivamente";
- `EXCEPTION_FORGOTTEN`: Exceção legal esquecida;
- `LAW_OR_CASELAW`: Literalidade de lei seca ou súmula;
- `INATTENTION`: Falta de atenção ou leitura rápida;
- `INTERPRETATION`: Extrapolação na interpretação textual;
- `REWRITE_MEANING`: Alteração semântica em reescrita;
- `CONTENT_UNKNOWN`: Conteúdo nunca estudado;
- `GUESS`: Chute incorreto;
- `OTHER`: Outro motivo.

Permite transformar qualquer erro em flashcard com 1 clique.
