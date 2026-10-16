# Migração de Dados Locais para o Supabase — Fase 3

## 1. Contexto

Durante as Fases 1 e 2, todo o progresso do candidato foi mantido no navegador via `localStorage` na chave `conc_store_v3`.  
Na Fase 3, esses dados são migrados para o PostgreSQL do Supabase mantendo:
- Total integridade das sessões de questões;
- Notas e cálculos Cebraspe;
- Caderno de erros;
- Flashcards e estado exato do algoritmo FSRS (due, stability, difficulty, reps);
- Produções discursivas (P3);
- Simulados registrados;
- Nível, XP acumulado e ofensiva na gamificação;
- Metas de estudo configuradas.

---

## 2. Fluxo de Importação Automático

1. **Detecção:** Ao realizar login no sistema com uma conta autenticada, o `DashboardLayoutClient` verifica a existência da chave `conc_store_v3` no `localStorage`.
2. **Confirmação do Usuário:** Se os dados locais forem detectados e ainda não tiverem sido migrados para esta conta, é exibido um card com banner de importação:
   > *"Encontramos dados locais deste navegador. Deseja sincronizá-los com sua conta na nuvem?"*
   > Botões: `[Sincronizar dados agora]` ou `[Dispensar e começar do zero]`
3. **Substituição de Identidade:** Todos os registros locais armazenados com `user_id = 'local-user'` são mapeados para o `auth.uid()` real do usuário logado antes do envio.
4. **Idempotência Estrita:**
   - A tabela `public.user_migrations` armazena o registro:
     `user_id = auth.uid()`, `migration_key = 'local_store_v3_import'`, `completed_at = now()`.
   - Se o usuário tentar importar novamente, a operação realiza `upsert` seguro e não duplica transações de XP nem sessões.
5. **Preservação de Segurança:** O `localStorage` local não é apagado imediatamente; ele é preservado como backup adicional de contingência e carimbado com `conc_store_v3_imported_at`.

---

## 3. Ordem de Execução do Pipeline

A importação respeita a seguinte ordem sequencial de dependência relacional:

1. `ensureUserStudyData(userId)` (Garante Exam, Subjects, Topics e SyllabusItems);
2. `topics` (Overrides de StudyScore, prioridade e status customizado);
3. `material_progress` (Páginas lidas, bookmarks e anotações);
4. `study_sessions` (Histórico de sessões de estudo);
5. `question_sessions` (Sessões Cebraspe resolvidas);
6. `error_logs` (Caderno de erros);
7. `flashcards` (Cards criados);
8. `flashcard_fsrs_state` (Estado FSRS do card);
9. `flashcard_reviews` (Histórico das revisões);
10. `discursive_sessions` (Sessões de discursiva P3);
11. `mock_exams` (Simulados realizados);
12. `study_events` (Histórico de eventos);
13. `gamification_profiles` (XP total, nível e streak);
14. `xp_transactions` (Extrato de pontuação com deduplicação);
15. `daily_missions` (Missões do dia);
16. `user_achievements` (Conquistas alcançadas);
17. `user_study_settings` (Configurações e preferências);
18. `user_migrations` (Marcação de sucesso da migração).
