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
1. Sessão de questões com >= 10 itens;
2. Estudo de material teórico >= 20 minutos OU material concluído no dia;
3. >= 10 revisões FSRS devidas realizadas;
4. 1 treino discursivo P3 registrado;
5. 1 simulado ou checkpoint registrado.

### Ritmo da Semana
- Meta configurável (padrão: 6 dias significativos por semana).
- Exibição visual limpa: `● ● ● ● ○ ○` (4/6 dias).
- Não há punição de perda de XP caso o streak seja quebrado.

---

## 6. Missões Diárias Estáveis e Automáticas

As missões do dia são geradas e fixadas na data (`store.dailyMissions[date]`):
1. **Missão Principal:** Nasce invariavelmente da Task #1 do plano estratégico (`generateDailyPlan().tasks[0]`). Exibe o bloco (P1/P2), disciplina, StudyScore, tempo sugerido e os fatores estratégicos reais do edital.
2. **Missões de Apoio:** Adaptam-se ao tempo diário disponível (`today_available_minutes`):
   - `<= 45 min`: Missão Principal + Memória/Questões rápidas.
   - `46–90 min`: Principal + Consolidação + Memória FSRS.
   - `91–150 min`: Principal + Questões + Memória + Recuperação de Erros.
   - `> 150 min`: Inclui treino discursivo P3.
3. **Progresso Automático:** Não há botão arbitrário de "Marcar como concluído". O progresso é derivado em tempo real das ações registradas (`QuestionSession`, `FlashcardReview`, `MaterialProgress`, `DiscursiveSession`, `ErrorLog`, `MockExam`).

---

## 7. Boss da Semana e Simulado Cebraspe (`MockExam`)

O Boss da Semana é um checkpoint estruturado que o candidato executa no TEC Concursos ou em simulados oficiais:
- A pontuação obedece estritamente às regras do Edital nº 1/2026:
  - `P1_net = P1_certas - P1_erradas`
  - `P2_net = P2_certas - P2_erradas`
  - `Total_net = P1_net + P2_net`
- Verificação automática dos cortes eliminatórios:
  - `P1 >= 18`
  - `P2 >= 27`
  - `Total >= 54`
- Feedback transparente: o sistema indica claramente se o desempenho está *"Acima do mínimo eliminatório do edital"* ou *"Abaixo do mínimo eliminatório do edital"*, nunca afirmando que "você seria aprovado", pois a nota de corte final é competitiva.

---

## 8. Progresso Acadêmico vs. XP

A interface separa visualmente:
- **XP / Level:** Esforço, frequência e adesão à rotina.
- **Progresso Acadêmico / Índice de Preparação (0 a 100%):** Maturidade curricular calculada por:
  - Cobertura do Edital (peso 35%): tópicos iniciados / 76
  - Domínio Médio (peso 30%): média dos `domain_score`
  - Retenção FSRS (peso 15%): taxa de acerto nas revisões
  - Prática P3 (peso 10%): treinos discursivos acumulados
  - Controle de Risco (peso 10%): penalidade por tópicos `AT_RISK`

---

## 9. Arquitetura de Armazenamento e Preparação para Supabase

- **Migração Segura V2 → V3:** `STORAGE_KEY_V3 = 'camara_estudos_store_v3'`, `STORE_VERSION = 3`. Todos os dados de sessões, tópicos, edital (182 itens) e histórico são integralmente preservados.
- **Preparação para Supabase:**
  - `xp_transactions`: Pronta para tabela `xp_transactions` com constraint `UNIQUE (source_event_id, rule_id)`.
  - `daily_missions`: Pronta para tabela `daily_missions` com chave estrangeira para `topics`.
  - `mock_exams`: Pronta para tabela `mock_exams` com colunas `p1_net`, `p2_net`, `net_points`.
