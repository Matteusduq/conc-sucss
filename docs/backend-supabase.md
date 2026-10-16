# Arquitetura e Configuração Backend Supabase — Fase 3

**Projeto:** conc-sucss (Cockpit Cebraspe 2027 — Analista Legislativo: Registro e Redação)  
**Projeto Supabase Ref:** `clwimgalqsgospuhizsz`  
**Endpoint:** `https://clwimgalqsgospuhizsz.supabase.co`  

---

## 1. Visão Geral da Arquitetura

Na **Fase 3**, o backend Supabase torna-se a **única fonte de verdade persistente** da aplicação. O `localStorage` deixa de ser o banco principal e passa a funcionar exclusivamente para importação transitória de dados legados (V3) e backups locais.

```
┌────────────────────────────────────────────────────────┐
│                   Navegador / Cliente                   │
│  - Zustand/React State (DashboardLayoutClient / Store) │
│  - FSRS Spaced Repetition Interativo                   │
│  - Timer & Execução de Sessões                         │
│  - Autenticação via Supabase Client (@supabase/ssr)    │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTPS / RLS (auth.uid())
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Next.js 16 SSR                      │
│  - Session Proxy (src/lib/supabase/proxy.ts)           │
│  - Validação estrita via supabase.auth.getClaims()    │
│  - Redirecionamento automático /auth/login             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Supabase Cloud Backend                │
│  - Supabase Auth (Email / Password)                    │
│  - PostgreSQL com RLS em TODAS as 25 tabelas           │
│  - Chaves compostas (user_id, id) para IDs de domínio  │
│  - Storage Privado: bucket 'study-materials'           │
└────────────────────────────────────────────────────────┘
```

---

## 2. Padrão de API Keys e Segurança

- **Chave Pública:** Utiliza estritamente o novo padrão Supabase:
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
- **Zero Secret Key no Client:** Nenhuma `service_role` ou chave secreta é exposta ao browser ou repositório.
- **Isolamento via RLS:** Toda autorização e particionamento de dados é garantido pelo banco através de `auth.uid() = user_id`.

---

## 3. Proxy de Sessão no Next.js 16

O Next.js 16 introduziu novas convenções para substituição e evolução do middleware.
- Implementado em: [`src/lib/supabase/proxy.ts`](file:///c:/Users/mathe/OneDrive/Área%20de%20Trabalho/Meus%20projetos%20(vibecode)/conc/src/lib/supabase/proxy.ts)
- Ponto de entrada: [`src/proxy.ts`](file:///c:/Users/mathe/OneDrive/Área%20de%20Trabalho/Meus%20projetos%20(vibecode)/conc/src/proxy.ts)
- **Segurança de Sessão:** Não confia no `getSession()` client-side manipulável. Utiliza `supabase.auth.getClaims()` para decodificar e verificar o JWT no servidor, renovando cookies automaticamente.
- **Rotas Protegidas:**
  - `/hoje`
  - `/jornada`
  - `/plano`
  - `/biblioteca`
  - `/memoria`
  - `/performance`
  - `/discursiva`
  - `/erros`
  - `/analytics`
  - `/configuracoes`
  - `/estudar/:path*`

Usuários sem sessão válida são redirecionados para `/auth/login?redirectTo=...`.

---

## 4. Estratégia de Identificadores e Chaves Compostas

O domínio da preparação possui IDs textuais semânticos de alta fidelidade:
- Tópicos: `top-p2-ling-3`, `top-p1-const-1`
- Questões: `qs-1729000000`
- Erros: `err-...`
- Flashcards: `fc-...`
- Discursiva: `disc-...`
- Simulados: `mock-...`

Para permitir escalabilidade multiusuário sem quebrar relações entre os 76 tópicos, 182 itens do edital e o motor FSRS, todas as tabelas usam **Primary Key Composta**:
```sql
PRIMARY KEY (user_id, id)
```
E as Foreign Keys relacionam `(user_id, foreign_id)` com `ON DELETE CASCADE`.
A única exceção é `public.profiles`, onde `id uuid PRIMARY KEY REFERENCES auth.users(id)`.

---

## 5. As 25 Tabelas do Schema Persistente

1. `profiles` — perfil de estudo e retenção desejada.
2. `user_study_settings` — preferências de cronograma e metas diárias.
3. `exams` — parâmetros normativos Cebraspe (P1, P2, P3, pesos, mínimos).
4. `exam_blocks` — Blocos P1 (Gerais), P2 (Específicos), P3 (Discursiva).
5. `subjects` — Disciplinas ativas do concurso.
6. `topics` — 76 tópicos com StudyScore, prioridade Cebraspe e rank starter.
7. `syllabus_items` — 182 itens literais do Edital nº 1/2026.
8. `topic_syllabus_items` — amarração N:N curricular.
9. `study_materials` — metadados dos materiais (status PENDING na Fase 3).
10. `material_progress` — progresso de leitura, marcações e notas por página.
11. `study_sessions` — registros de tempo líquido estudado.
12. `question_sessions` — sessões de resolução com cálculo Cebraspe (c - e).
13. `error_logs` — caderno de erros categorizados e resoluções.
14. `flashcards` — repositório de repetição espaçada.
15. `flashcard_fsrs_state` — estabilidade, dificuldade e agendamento FSRS.
16. `flashcard_reviews` — log detalhado de revisões FSRS.
17. `discursive_sessions` — produções de P3 (questões 20L e parecer 50L) com notas de conteúdo e língua.
18. `mock_exams` — simulados completos e checkpoints.
19. `study_events` — stream de eventos para gamificação.
20. `gamification_profiles` — total XP, nível, streak e dias significativos.
21. `xp_transactions` — extrato de XP com constraint de unicidade idempotente.
22. `daily_missions` — missões diárias sugeridas pelo motor.
23. `user_achievements` — conquistas desbloqueadas.
24. `user_migrations` — histórico de migrações e importações locais executadas.
25. `ai_insights` — reservada para IA em fases posteriores.

---

## 6. Storage de Materiais de Estudo

- **Bucket:** `study-materials` (Privado).
- **MIME Permitido:** `application/pdf`.
- **Limite por Arquivo:** 50 MB.
- **Convenção de Paths:**
  `/{user_id}/{exam_id}/{subject_slug}/{topic_slug}/{filename}`
- **Políticas de Acesso (RLS):**
  - Usuários só realizam `SELECT`, `INSERT`, `UPDATE` e `DELETE` em arquivos cujo primeiro segmento do path seja o seu próprio `auth.uid()`.
  - Acesso a arquivos é feito por Signed URLs temporárias geradas pelo helper `src/lib/storage/study-materials.ts`.
