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
NEXT_PUBLIC_SUPABASE_URL=https://clwimgalqsgospuhizsz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_PROJECT_REF=clwimgalqsgospuhizsz
```

### 3.3. Executar Testes Unitários
```bash
npm test
```
Executa a suíte Vitest (101 testes) validando cálculos de acurácia, nota líquida Cebraspe, cálculo de domínio, pontuação discursiva oficial, integridade do edital (P1/P2/P3), gamificação, FSRS, RLS e repositório Supabase.

### 3.4. Executar em Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000`. Se não autenticado, você será direcionado para `/auth/login`.

### 3.5. Compilação de Produção
```bash
npm run build
```

---

## 4. Estrutura e Banco de Dados Supabase (Fase 3)

### 4.1. Migração Consolidada (`supabase/migrations/`)
- `20261016000000_consolidated_schema.sql`:
  Schema inicial consolidado limpo com as **25 tabelas**, chaves compostas `(user_id, id)` para suporte a IDs de domínio textuais (`top-...`, `qs-...`, `fc-...`), índices de performance, grants para `authenticated`, políticas RLS estritas de isolamento por `(auth.uid() = user_id)`, tabela `user_migrations` para importação idempotente e configuração do bucket privado `study-materials`.
- As migrações antigas pré-Fase 2 foram arquivadas em `docs/archive-migrations/`.

### 4.2. Bootstrap do Usuário (`src/lib/data/bootstrap-user.ts`)
Executado automaticamente e de forma idempotente no primeiro login do candidato:
1. Perfil e configurações de estudo;
2. Concurso Câmara dos Deputados 2027 com parâmetros oficiais Cebraspe;
3. Blocos P1, P2 e P3;
4. 9 Disciplinas oficiais;
5. **76 Topics** estruturados com StudyScore e starter_rank;
6. **182 SyllabusItems** do Edital nº 1/2026;
7. Relações N:N `topic_syllabus_items`;
8. 76 Placeholders de materiais de estudo (`PENDING`);
9. Perfil de Gamificação inicial zerado (0 XP, Nível 1).

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
