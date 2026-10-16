# Jornada Gamificada e Sistema Adaptativo de Preparação (Fase 2)

Cockpit de Estudos — Concurso da Câmara dos Deputados  
Cargo 11: Analista Legislativo — Especialidade: Registro e Redação  
Banca: Cebraspe • Edital nº 1/2026 • Data da Prova: 17/01/2027  

---

## 1. Objetivo da Gamificação e Filosofia Pedagógica

A gamificação do Cockpit não é um fim em si mesma nem o motor que decide o que o candidato deve estudar. O sistema opera sob uma hierarquia estrita:

```
Edital nº 1/2026
  ↓
StudyScore (pesos pedagógicos, cortes eliminatórios e risco)
  ↓
Desempenho Real (sessões no TEC, FSRS, Discursiva)
  ↓
Revisão e Plano Diário (Task #1 e interleaving)
  ↓
Missões Diárias
  ↓
XP / Conquistas / Nível da Jornada
```

### Princípios Não Negociáveis:
1. **Gamificação não é o motor pedagógico:** O StudyScore e o Edital continuam sendo a fonte única de priorização acadêmica.
2. **Sem rankings sociais ou leaderboards:** O sistema é estritamente pessoal e orientado ao domínio próprio.
3. **Não punir erros:** Erros no Cebraspe são dados pedagógicos cruciais. O sistema valoriza o ciclo `erro → análise → correção (+10 XP)`.
4. **Sem recompensas por atividades vazias:** Não há ganho de XP por abrir páginas, navegar na biblioteca ou clicar em botões. XP representa **trabalho útil e verificável realizado**.

---

## 2. Fases da Jornada (`JourneyPhase`)

A preparação evolui dinamicamente em 4 fases calculadas deterministicamente por `calculateJourneyPhase`:

| Fase | Limite Temporal / Critério | Foco Pedagógico Principal | Meta Semanal P3 | Boss Semanal |
|---|---|---|---|---|
| **Fase A — Base e Cobertura** (`BASE`) | `daysUntilExam > 60` e cobertura < 65% | Fundamentos, materiais didáticos de alta prioridade, primeiras questões e memória inicial | 1 treino/sem | Checkpoint de 30 itens (15 P1 + 15 P2) |
| **Fase B — Consolidação** (`CONSOLIDATION`) | `daysUntilExam <= 60` OU cobertura >= 65% | Volume massivo de questões Cebraspe, resolução de erros pendentes e FSRS | 2 treinos/sem | Checkpoint de 60 itens (30 P1 + 30 P2) |
| **Fase C — Ritmo de Prova** (`EXAM_MODE`) | `15 <= daysUntilExam <= 30` | Questões mistas, controle de tempo, pontuação líquida (+1/-1/0) e simulados parciais | 2 treinos/sem | Simulado Parcial de 90 itens (45 P1 + 45 P2) |
| **Fase D — Reta Final** (`FINAL_SPRINT`) | `daysUntilExam <= 14` | Blindagem de erros recorrentes, cards vencidos, tópicos AT_RISK e simulado completo | 1 treino de manutenção | Simulado Completo de 180 itens (90 P1 + 90 P2) |
| **Pós-Prova** (`POST_EXAM`) | `daysUntilExam <= 0` | Análise de gabarito preliminar e recursos pós-edital | - | Ciclo concluído |

*Nota:* Cobertura relevante (>= 65% dos tópicos iniciados) antecipa a transição para Consolidação, adaptando-se à velocidade real do candidato.

---

## 3. XP (Experience Points) e Fórmulas de Level

O XP reflete o esforço e o volume de estudo real executado.

### 3.1 Tabela de Regras de XP (`GAMIFICATION_RULES`):
- **Questões no TEC:**
  - 2 XP por questão válida.
  - Teto por sessão: 60 XP (equivalente a 30 questões).
  - Teto diário de volume de questões: 120 XP/dia.
  - Bônus por bateria consistente: +20 XP ao concluir sessão com >= 15 questões.
- **Materiais Didáticos:**
  - Sessão real de estudo >= 20 minutos (1.200s): 30 XP (cap: 60 XP/dia).
  - Conclusão do material de um Tópico: +80 XP ONE-TIME por tópico (idempotente).
- **Memória FSRS:**
  - 1 XP por revisão de card vencido (devido).
  - Teto diário de revisões unitárias: 30 XP/dia.
  - Bônus diário ao zerar a fila de revisões vencidas do dia: +15 XP (1x ao dia).
- **Caderno de Erros:**
  - Registro detalhado de erro: 5 XP (teto: 25 XP/dia).
  - Erro marcado como resolvido: +10 XP ONE-TIME por erro.
- **Prova Discursiva (P3):**
  - Questão Discursiva de 20 linhas concluída: 60 XP.
  - Peça Técnica de 50 linhas concluída: 100 XP.
- **Simulados e Checkpoints:**
  - Checkpoint semanal / Boss da semana: 120 XP.
  - Simulado completo: 200 XP.
- **Missões Diárias:**
  - Missão concluída: +25 XP.
  - Todas as missões do dia concluídas: +40 XP de bônus diário.
- **Conquistas:**
  - 50 a 200 XP one-time por marco desbloqueado.

### 3.2 Fórmula do Nível da Jornada
- `XP_PER_LEVEL = 1000`
- `level = 1 + Math.floor(totalXp / 1000)`
- **Propriedade fundamental:** O nível da jornada é monotonicamente crescente e nunca diminui.

---

## 4. Mecanismos Anti-Farming e Idempotência

Para impedir abusos (como recarregar páginas, cliques artificiais ou repetições imediatas):
1. **Ledger Idempotente (`XpTransaction`):** A chave combinada `rule_id + source_event_id` é rigorosamente única. Toda transação é checada antes da inserção.
2. **Tetos Diários por Categoria:** Baterias de questões (120 XP/dia), log de erros (25 XP/dia) e flashcards (30 XP/dia) possuem limites computados em fuso horário local (`America/Sao_Paulo`).
3. **Revisões Fora da Fila:** Cards não devidos revisados repetidamente concedem 0 XP.
4. **Reabertura de Material:** Reabrir PDF ou material já concluído não reemite os 80 XP de conclusão.

---

## 5. Dia de Estudo Significativo e Ritmo Semanal

A sequência (streak) não recompensa abrir o app ou efetuar login. Um dia é considerado significativo (`isMeaningfulStudyDay`) apenas quando contém pelo menos UMA atividade pedagógica substancial:
1. Sessão de questões com >= 10 itens no dia;
2. Estudo de material teórico >= 20 minutos no dia via `StudySession` OU material concluído na data;
3. >= 10 revisões FSRS devidas no dia (`was_due_at_review !== false`);
4. 1 treino discursivo P3 registrado na data;
5. 1 simulado ou checkpoint registrado na data.

### Ritmo da Semana
- Meta configurável (padrão: 6 dias significativos por semana).
- Exibição visual limpa: `● ● ● ● ○ ○` (4/6 dias).
- Não há punição de perda de XP caso o streak seja quebrado.

---

## 6. Missões Diárias Estáveis e Automáticas

As missões do dia são geradas e fixadas na data (`store.dailyMissions[date]`):
1. **Missão Principal:** Nasce invariavelmente da Task #1 do plano estratégico (`generateDailyPlan().tasks[0]`).
   - Se o material obrigatório estiver pendente (`PENDING`), o motor transita para `WAITING_MATERIAL` e **não recomenda questões como substituto de teoria**.
   - Se houver tópicos elegíveis com material disponível ou em consolidação/revisão, o sistema prioriza esses conteúdos para a missão executável.
   - Se nenhum tópico possuir material e não houver histórico de estudo, o sistema exibe: *"Sua trilha estratégica já está definida. Os materiais ainda estão sendo preparados."* sem inventar missões artificiais.
2. **Missão de Memória FSRS:**
   - Só é gerada se `dueCards.length > 0`.
   - Meta calibrada: `target = min(25, dueCards.length)`.
   - Se não houver cartões devidos, nenhuma missão de memória é criada.
3. **Agenda Semanal P3 (Prova Discursiva):**
   - Respeita `phaseInfo.discursiveWeeklyTarget` (1x/sem na Base, 2x/sem na Consolidação e Exam Mode).
   - Não é gerada todo dia só por ter minutos disponíveis.
   - Disponível para candidatos com `>= 60 min` diários em dias apropriados.
   - Alternância de formato: Questão de até 20 linhas (Q20) e Peça Técnica de até 50 linhas.
4. **Progresso Automático:** Não há botão arbitrário de "Marcar como concluído". O progresso é derivado em tempo real de eventos reais (`QuestionSession`, `FlashcardReview` devidos, `StudySession`, `DiscursiveSession`, `ErrorLog`, `MockExam`).

---

## 7. Boss da Semana e Simulado Cebraspe (`MockExam`)

O Boss da Semana é um checkpoint estruturado que o candidato executa no TEC Concursos ou em simulados oficiais:
- Validação estrita por `qualifiesForWeeklyBoss(mock, recommendation)`:
  - Checkpoint da Fase: exige volume mínimo de itens totais, P1 e P2.
  - `FULL_MOCK`: exige **exatamente 90 itens em P1 e 90 itens em P2 (180 itens total)**.
  - `PARTIAL_MOCK`: aceita volume variável para ritmo, concedendo +60 XP apenas se `>= 30 itens`.
- Feedback transparente: se o simulado registrado não atingir as metas da fase, o sistema exibe: *"Simulado registrado, mas não completou o Checkpoint Semanal. Faltaram X itens de P1 e Y itens de P2"*, e não marca o Boss como derrotado.

---

## 8. Progresso Acadêmico Real vs. XP

A interface separa visualmente:
- **XP / Level:** Esforço, consistência e volume de estudo.
- **Índice de Preparação Acadêmica (0 a 100%):** Maturidade curricular sem dados substitutos inventados:
  - **Pesos Base Dinâmicos:**
    - Cobertura Significativa: 35%
    - Domínio Médio: 35%
    - Retenção FSRS: 15%
    - Prontidão P3: 15%
  - **Redistribuição Proporcional:** Se não houver dados de retenção, domínio ou P3, o componente é `null` (exibido na UI como `—` / *"Sem dados suficientes"*) e os pesos restantes são redistribuídos.
  - **Usuário Zerado:** Índice = 0%, Confiança = `NO_DATA`. Nunca exibe 24% fictício.
  - **Risco como Penalidade:** O status `AT_RISK` atua como penalidade deduzida ao final (`highAtRisk * 5 + mediumAtRisk * 3 + lowAtRisk * 1`, teto de 20 pontos), e nunca como bônus por ausência de dados.
  - **Prontidão P3:** Avaliada pelo desempenho real normalizado (70% qualidade dos treinos + 30% volume recente de treinos válidos).
  - **Nível de Confiança:** `NO_DATA`, `LOW`, `MEDIUM`, `HIGH`, documentando a densidade amostral da preparação.

---

## 9. Bootstrap Pedagógico (Starter Mode)

Para usuários iniciando a preparação do zero (`meaningfulCoveragePercent < 10%` e sem histórico de desempenho), o Cockpit adota uma sequência deliberada de bootstrap:
- **Rank 1:** P2 — Linguística: Leitura, compreensão, coesão, coerência e inferência (`top-p2-ling-3`)
- **Rank 2:** P1 — Português: Interpretação, compreensão, tipos e gêneros textuais (`top-p1-port-1`)
- **Rank 3:** P2 — Processo Legislativo: Procedimentos legislativos e etapas (`top-p2-leg-1`)
- **Rank 4:** P1 — Constitucional/RICD: Poder Legislativo — Congresso, Câmara, Senado, competências (`top-p1-const-5`)
- **Rank 5:** P2 — Linguística: Produção textual, recursos estilísticos e adequação (`top-p2-ling-5`)
- **Rank 6:** P2 — Reconhecimento de Fala e IA: ASR e fundamentos (`top-p2-asr-1`)
- **Rank 7:** P1 — Administrativo: Lei 14.133 — fundamentos, modalidades e contratação direta (`top-p1-adm-10`)
- **Rank 8:** P1 — TI: Inteligência Artificial e engenharia de prompts (`top-p1-ti-5`)

Assim que o aluno realiza sessões e avança a cobertura, o `StudyScore` e o motor adaptativo assumem a dinâmica completa da fila.

---

## 10. Arquitetura de Armazenamento e Preparação para Supabase

- **Sessões Reais via `StudySession`:**
  - Cada bloco de leitura teórico é registrado como `StudySession` com `started_at`, `ended_at`, `duration_seconds`.
  - Impede que minutos de ontem vazem para a meta do dia corrente.
  - Concede 30 XP por sessão real >= 20 min (teto 60 XP/dia) com idempotência por ID de sessão (`MATERIAL_SESSION_${session.id}`).
- **Migração Segura V2 → V3:** `STORAGE_KEY_V3 = 'camara_estudos_store_v3'`, `STORE_VERSION = 3`. Todos os 182 SyllabusItems, 76 Topics, parâmetros oficiais Cebraspe e histórico são integralmente preservados.

