# Plano de Integração de Inteligência Artificial (AI Integration Plan)

> **Status:** Módulo Preparado e Desativado.
> Nenhuma chamada de API externa é realizada nesta versão.
> O sistema opera com autonomia total por meio do motor determinístico.

---

## 1. Princípio Fundamental de Design com IA
A decisão determinística continua sendo a fonte primária e irrevogável do planejamento pedagógico.
- O algoritmo calcula as pontuações de domínio, confiança, urgência e nota líquida Cebraspe;
- A IA atua como **camada explicativa e assistiva**, fornecendo diagnósticos textuais e sugerindo cartões candidatos;
- A IA **nunca** substitui silenciosamente as métricas do banco de dados e **nunca** insere flashcards sem revisão humana explícita.

---

## 2. Pontos de Integração Preparados na Arquitetura

### 2.1. Análise Semanal (`generateWeeklyAnalysis`)
- **Ponto de chamada:** Servidor / Cron semanal ou abertura de Dashboard na segunda-feira;
- **Input:**
  - Minutos estudados na semana;
  - Volume de questões e acurácia por disciplina;
  - Tópicos em risco (`AT_RISK`) ou com domínio em queda;
- **Output esperado:**
  - Relatório diagnóstico de forças e fraquezas formatado em Markdown;
  - Recomendações estratégicas para a semana seguinte;
- **Armazenamento:** Tabela `ai_insights` (`type = 'WEEKLY_ANALYSIS'`).

### 2.2. Diagnóstico Cognitivo de Erros (`analyzeErrorPatterns`)
- **Ponto de chamada:** Tela do Caderno de Erros (`/erros`);
- **Input:**
  - Frequência dos erros por categoria (ex: 35% troca de competência, 25% exceções esquecidas);
  - Dispositivos legais envolvidos;
- **Output esperado:**
  - Identificação de pontos cegos de memorização e sugestão de regras mnemônicas para o Cebraspe;
- **Armazenamento:** Tabela `ai_insights` (`type = 'ERROR_ANALYSIS'`).

### 2.3. Geração Assistida de Flashcards (`generateFlashcards`)
- **Ponto de chamada:** Botão *"Gerar cartões com IA"* na tela de leitura do material (`/estudar/[topicId]`);
- **Input:**
  - Trecho do PDF ou conteúdo do tópico;
  - Prioridade do tópico (`HIGH`, `MEDIUM`, `LOW`);
  - Disciplina e estilo da banca (Cebraspe / Certo ou Errado);
- **Regra de Segurança Obrigatória:**
  - A IA gera uma lista de **cartões candidatos** (`FlashcardDraft`);
  - O sistema exibe o **Modal de Curadoria Humana**:
    - `[Aceitar]`
    - `[Editar]`
    - `[Excluir]`
    - `[Aceitar Selecionados]`
  - Apenas cartões explicitamente aprovados pelo usuário são persistidos na tabela `flashcards` com seus respectivos registros no `flashcard_fsrs_state`.

### 2.4. Ajuste e Exoneração de Backlog (`suggestStudyAdjustment`)
- **Ponto de chamada:** Tela Hoje (`/hoje`) caso haja backlog de revisões;
- **Input:** Dias até a prova (2027-01-17), horas disponíveis hoje, histórico recente;
- **Output:** Sugestão de remanejamento sem culpa, mantendo o foco nas matérias de maior peso.

---

## 3. Interfaces TypeScript Definidas no Código
O contrato está estabelecido em `src/lib/ai/provider.ts` e `src/lib/ai/types.ts`:

```typescript
export interface AIProvider {
  generateWeeklyAnalysis(input: WeeklyAnalysisInput): Promise<AIInsightOutput>;
  analyzeErrorPatterns(input: ErrorPatternInput): Promise<AIInsightOutput>;
  generateFlashcards(input: FlashcardGenerationInput): Promise<FlashcardDraft[]>;
  suggestStudyAdjustment(input: StudyAdjustmentInput): Promise<AIInsightOutput>;
}
```

O `MockAIProvider` em `src/lib/ai/mock-provider.ts` é a implementação ativa por padrão, retornando status `none` e arrays vazios para não gerar dados falsos.

---

## 4. Variáveis de Ambiente Futuras
Quando a integração for ativada no backend (Server Actions / Route Handlers), as variáveis abaixo serão preenchidas no `.env.local`:

```env
AI_PROVIDER=google-gemini # ou openai, anthropic
AI_API_KEY=sua_chave_aqui
AI_MODEL=gemini-2.5-pro
```

Essas variáveis nunca serão prefixadas com `NEXT_PUBLIC_` para impedir exposição no bundle do cliente.
