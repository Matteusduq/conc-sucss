# Sistema de Estudos — Câmara dos Deputados 2027
### Analista Legislativo — Especialidade: Registro e Redação
**Data da Prova:** 17 de janeiro de 2027 | **Banca:** Cebraspe (Certo / Errado)

---

## 1. Visão Geral do Produto
O **Sistema de Estudos para a Câmara dos Deputados** é um centro de comando pessoal para organização e otimização da preparação de alto rendimento para concurso público.

O sistema não substitui o **TEC Concursos** e não é um banco de questões próprio: questões continuam sendo resolvidas externamente no TEC. O sistema atua como o cérebro da preparação, calculando em tempo real:
- **O que estudar agora:** priorização orientada por algoritmo e adaptada ao rendimento real;
- **Estrutura integral do edital (Edital nº 1/2026 — Cargo 11: Registro e Redação):**
  - **P1 — Conhecimentos Básicos:** 5 disciplinas (Língua Portuguesa, Língua Inglesa, Direito Administrativo e Administração Pública, Direito Constitucional e Regimento Interno, Tecnologia da Informação e Dados);
  - **P2 — Conhecimentos Específicos:** 4 disciplinas (Linguística, Reconhecimento de Fala, Transcrição e IA, Processo Legislativo e Regimentos, Ciência Política);
  - **P3 — Prova Discursiva:** módulo de treino com 2 questões discursivas de até 20 linhas e 1 peça técnica de até 50 linhas;
- **Formato adequado de material:**
  - `HIGH`: PDF completo
  - `MEDIUM`: PDF simplificado
  - `LOW`: Resumo
- **Desempenho Cebraspe:** cálculo rigoroso da nota líquida ($C - E$) com penalização de 1 erro anulando 1 acerto;
- **Domínio Real (0–100):** índice composto ponderado entre desempenho prático ($50\%$), retenção espaçada ($25\%$), recência ($15\%$) e cobertura ($10\%$);
- **Caderno de Erros Cognitivo:** taxonomia de falhas Cebraspe com conversão direta em flashcards;
- **Repetição Espaçada FSRS:** motor baseado no algoritmo de ponta `ts-fsrs` com ordenação dos cartões devidos orientada por prioridade e gravidade de erro;
- **Cockpit Diário (`/hoje`):** planejamento dinâmico do dia, alertas de risco e visão integrada de P1, P2 e P3.

---

## 2. Stack Tecnológico & Requisitos de Runtime

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server Components e Client Components isolados |
| **Linguagem** | TypeScript 5 | Tipagem estrita de banco e regras de negócio |
| **Estilização** | Tailwind CSS v4 | Design system profissional dark mode |
| **Banco & Storage**| Supabase | PostgreSQL, RLS por `auth.uid()`, Bucket Privado |
| **Repetição Espaçada**| `ts-fsrs` (v5.4.2) | FSRS (Free Spaced Repetition Scheduler) |
| **Leitura de PDFs** | `react-pdf` & `pdfjs-dist` | Renderização com persistência de progresso e notas |
| **Gráficos** | `recharts` | Visualização de evolução líquida e distribuições |
| **Testes Unitários**| `vitest` | Suíte de testes automatizados para regras críticas e edital |

### Requisitos de Runtime
- **Node.js:** v20+ (testado e verificado no Node v24.18.0);
- **NPM:** v10+.

---

## 3. Setup e Instalação Local

### 3.1. Clonar e Instalar Dependências
```bash
npm install
```

### 3.2. Configurar Variáveis de Ambiente
Copie o modelo de ambiente:
```bash
cp .env.example .env.local
```

Conteúdo de `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui

# SOMENTE FUTURO — ainda não ativar nesta etapa
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
```

### 3.3. Executar Testes Unitários
```bash
npm test
```
Executa a suíte Vitest validando cálculos de acurácia, nota líquida Cebraspe, cálculo de domínio, pontuação discursiva oficial, integridade do edital (P1/P2/P3), migração do store e ordenação FSRS.

### 3.4. Executar em Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000`. A aplicação redirecionará automaticamente para o cockpit em `/hoje`.

### 3.5. Compilação de Produção
```bash
npm run build
```

---

## 4. Estrutura e Banco de Dados Supabase

### 4.1. Migrations (`supabase/migrations/`)
- `20261014000000_initial_schema.sql`:
  Criação das tabelas centrais (`profiles`, `exams`, `subjects`, `topics`, `study_materials`, `material_progress`, `study_sessions`, `question_sessions`, `error_logs`, `flashcards`, `flashcard_fsrs_state`, `flashcard_reviews`, `user_study_settings`, `mock_exams`, `study_events`, `ai_insights`), índices e políticas RLS de propriedade restrita (`auth.uid() = user_id`).
- `20261014000001_storage.sql`:
  Criação do bucket privado `study-materials` com limite de 100MB e políticas de acesso restritas a `/{user_id}/...`.
- `20261014000002_complete_exam_structure.sql`:
  Criação das tabelas `exam_blocks`, `syllabus_items`, `topic_syllabus_items`, `discursive_sessions`, colunas de bloco e relevância em `subjects` e `topics`, metadados de mínimos eliminatórios em `exams`, e políticas RLS.

### 4.2. Seed Oficial (`supabase/seed.sql`)
Função PL/pgSQL `public.seed_camara_exam_data(p_user_id uuid)` que insere com fidelidade:
1. Concurso **Câmara dos Deputados 2027** com metadados oficiais e mínimos Cebraspe;
2. Blocos de Prova P1, P2 e P3;
3. 9 Disciplinas (5 em P1 e 4 em P2);
4. Unidades de estudo práticas (`topics`) vinculadas a itens oficiais do edital (`syllabus_items`);
5. Placeholders de material com status `PENDING` ("Aguardando PDF") vinculados 1:1 com as unidades práticas.

---

## 5. Rotas e Módulos da Aplicação

| Rota | Descrição |
| :--- | :--- |
| `/hoje` | **Cockpit Principal:** Countdown para 17/01/2027, KPIs, distribuição do dia, fila prioritária P1/P2 e acompanhamento de P3. |
| `/plano` | **Plano do Edital:** Tabela de unidades de estudo com filtros por bloco (P1/P2), prioridade, status, inspeção de itens oficiais do edital e override manual. |
| `/biblioteca` | **Biblioteca:** Cards de PDFs divididos por bloco e matéria com status "Aguardando PDF" (1 material por unidade prática, sem arquivos fake). |
| `/estudar/[topicId]` | **Leitor de PDF:** Componente com controle de páginas, zoom, timer, bookmarks, notas por página e botão "Gerar cartões com IA" (desativado com tooltip). |
| `/memoria` | **Memória Espaçada (FSRS):** Cartões devidos, novos, em aprendizagem e maduros, retenção real e sessão de revisão com atalhos de teclado (1, 2, 3, 4, Espaço). |
| `/performance` | **Desempenho:** Registro de sessões do TEC, filtros por bloco P1/P2, cálculo de acertos, erros, brancos e nota líquida Cebraspe, gráficos e simulados. |
| `/discursiva` | **Módulo Discursivo (P3):** Registro de treinos com questões de até 20 linhas e peças de até 50 linhas, aplicando a fórmula oficial de penalização por erros gramaticais ($NQ$ e $NPT$). |
| `/erros` | **Caderno de Erros:** Taxonomia cognitiva Cebraspe, agregação de padrões recorrentes e conversão direta em flashcard. |
| `/analytics` | **Analytics:** Visão separada de Cobertura P1, Cobertura P2 e Treino P3, notas líquidas, distribuição e matriz de risco. |
| `/configuracoes` | **Configurações:** Parâmetros oficiais do edital (P1 90 itens min 18, P2 90 itens min 27, P3 60 pts min 30), data da prova configurável, metas semanais e FSRS. |

---

## 6. Documentação Complementar
- [Estrutura Oficial do Concurso](file:///docs/exam-structure.md): Regras oficiais do Edital nº 1/2026, blocos P1/P2/P3, pontuação Cebraspe e fórmulas discursivas.
- [Mapeamento do Edital](file:///docs/syllabus-map.md): Matriz de correspondência entre unidades de estudo (`Topic`) e itens oficiais (`SyllabusItem`).
- [Regras de Negócio Detalhadas](file:///docs/business-rules.md): Especificação matemática de domínio, Cebraspe performance, distinção Topic vs SyllabusItem e FSRS.
- [Plano de Integração da IA](file:///docs/ai-integration-plan.md): Contratos, interfaces e fluxos da futura IA (com curadoria humana obrigatória).
- [Plano de Importação de PDFs](file:///docs/pdf-import-plan.md): Estrutura de Storage e mapeamento para inserção dos PDFs reais no próximo prompt.
