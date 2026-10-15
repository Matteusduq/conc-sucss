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

Calculado para cada tópico para montar a fila prioritária de estudo e responder deterministamente à pergunta central: *"O que eu devo estudar agora e por quê?"*.

### 6.1. Fórmula Base
$$\text{study\_score} = \text{priority} \times 0.35 + \text{mastery\_gap} \times 0.30 + \text{review\_urgency} \times 0.20 + \text{stage\_urgency} \times 0.10 + \text{confidence\_gap} \times 0.05$$

Onde:
- **priority:** `HIGH` = 100, `MEDIUM` = 60, `LOW` = 25;
- **mastery\_gap:** $100 - \text{domain\_score}$ (se não iniciado: $100$ para HIGH, $75$ para MEDIUM, $50$ para LOW);
- **review\_urgency:** urgência derivada do backlog de repetições FSRS;
- **stage\_urgency:** urgência do ciclo de aprendizado (`NOT_STARTED` = 100 para HIGH, 75 para MEDIUM, 40 para LOW; `AWAITING_QUESTIONS` = 90; `CONSOLIDATING` = 60; `MAINTENANCE` = 30; `MASTERED` = 15);
- **confidence\_gap:** deficiência de amostragem estatística ($100 - \text{confidence}$).

### 6.2. Boosters Aplicados

#### Boosters de Desempenho e Ciclo de Vida:
1. $+15$ se status `AT_RISK` (tópico em perigo crítico de reprovação);
2. $+10$ se duas sessões recentes $< 60\%$ de assertividade;
3. $+8$ se prioridade `HIGH` e `NOT_STARTED` (aceleração inicial do edital);
4. $+8$ se revisão de flashcards muito atrasada ($> 5$ devidos);
5. $+5$ se `AWAITING_QUESTIONS` há mais de 2 dias.

#### Boosters Estratégicos Normativos do Concurso:
6. $+3$ se Conhecimento Específico (**P2**):
   - *Motivo normativo:* 90 itens com mínimo eliminatório mais rigoroso (mín. 27 pontos vs mín. 18 pontos em P1) e critério normativo primário de desempate acadêmico no Edital nº 1/2026.
7. Sinergia com a Prova Discursiva (**P3**):
   - $+3$ se `discursive_synergy === 'HIGH'` (ex: Regimento Interno, Processo Legislativo e Prática de Redação Parlamentar);
   - $+2$ se `discursive_synergy === 'MEDIUM'` (ex: Direito Constitucional Aplicado ao Congresso);
   - $+1$ se `discursive_eligible` e bloco P2 (disciplina elegível para questões discursivas de conhecimentos específicos).

Clamp final: $0 \le \text{study\_score} \le 100$.

### 6.3. Cálculo do StudyScore no Primeiro Acesso (Zero Histórico)
Ao inicializar uma preparação nova (brand-new store), todos os 76 tópicos recebem imediatamente seu StudyScore derivado pelo motor central através de `computeInitialStudyScores(SEED_TOPICS)`.
Nenhum tópico permanece com `study_score = 0`.
Os tópicos de alta prioridade recebem scores calibrados:
- **P2 HIGH com alta sinergia discursiva:** Score 100 (ex: Regimento Interno, Processo Legislativo, Redação Legislativa);
- **P2 HIGH com média sinergia discursiva:** Score 99 (ex: Direito Constitucional Aplicado);
- **P2 HIGH sem sinergia especial:** Score 98;
- **P1 HIGH:** Score 94 (ex: Língua Portuguesa - Tipologia/Textualização, Transformação Digital);
- **P2 MEDIUM:** Score 65;
- **P1 MEDIUM:** Score 61;
- **P2 LOW:** Score 52;
- **P1 LOW:** Score 48.

Essa calibração garante estritamente que $\text{HIGH} > \text{MEDIUM} > \text{LOW}$ em qualquer bloco.

### 6.4. Regra de Desempate Determinístico (8 Níveis)
Se dois tópicos possuírem o mesmo `study_score`, a ordenação **não depende da ordem do array de seed**. O desempate é estritamente determinístico através da função `compareTopicsForQueue(a, b)`, avaliando nesta ordem:
1. **Situação de Risco:** `AT_RISK` ($6$) > `AWAITING_QUESTIONS` ($5$) > `NOT_STARTED` ($4$) > `LEARNING` ($3$) > `CONSOLIDATING` ($2$) > `MAINTENANCE` ($1$) > `MASTERED` ($0$);
2. **Prioridade Pedagógica:** `HIGH` ($3$) > `MEDIUM` ($2$) > `LOW` ($1$);
3. **Sinergia com P3:** `HIGH` ($4$) > `MEDIUM` ($3$) > `LOW` ($2$) > Elegível ($1$) > Nenhuma ($0$);
4. **Relevância Estratégica do Bloco:** `P2` ($2$) > `P1` ($1$);
5. **Menor Domínio / Menor Confiança:** maior deficiência do aluno é priorizada (menor `domain_score`, seguido de menor `domain_confidence`);
6. **Menor Cobertura:** tópicos `NOT_STARTED` antecedem tópicos parcialmente estudados;
7. **Tempo sem Estudo:** data de último estudo mais remota (ou nunca estudado) precede estudos recentes;
8. **Identificador Técnico:** `display_order` seguido de `id.localeCompare` como desempate final técnico e estável.

### 6.5. Equilíbrio entre P1 e P2 (Interleaving da Fila Diária)
- **Vantagem moderada de P2:** P2 lidera a fila diária conquistando a **Missão Principal** (posição #1) devido à maior pontuação líquida exigida (27 pts) e sinergia com a peça técnica da prova P3.
- **Não exclusão de P1:** A função `orderTopicsForDailyPlan` intercala tópicos P2 e P1 dentro de cada faixa de prioridade. Dessa forma, a posição #2 (**Próximo Passo**) é assegurada ao tópico mais prioritário de P1 (ex: Língua Portuguesa), impedindo que o aluno passe dias estudando apenas matérias específicas e negligencie o corte mínimo de 18 pontos em P1.
- **Prioridade Dinâmica de Risco:** Um tópico de P1 que entre em situação `AT_RISK` (queda brusca de rendimento ou domínio crítico) ganha $+15$ pontos e fura a fila, assumindo a posição #1 antes de novos conteúdos teóricos de P2.

### 6.6. Diferença entre Prioridade do Edital e Desempenho Individual
- **Prioridade Estrutural do Edital:** Fator intrínseco estático baseado no peso normativo do conteúdo, número de questões esperadas, requisitos do cargo e relevância para as provas discursivas (P3);
- **Desempenho Individual do Aluno:** Fator dinâmico derivado de métricas reais (assertividade no TEC, pontos líquidos Cebraspe C/E, tempo de resposta, estabilidade no algoritmo FSRS e quantidade de erros cognitivos reincidentes).
O `study_score` funde ambos os fatores: o edital define o ponto de partida e os pesos máximos; o histórico do aluno calibra em tempo real as urgências de recuperação e manutenção.

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
