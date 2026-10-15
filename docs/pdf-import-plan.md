# Plano de Importação de PDFs de Estudo (PDF Import Plan)

Este documento define a especificação para a inserção e upload dos PDFs reais de estudo para cada tópico do concurso da Câmara dos Deputados no próximo prompt.

---

## 1. Estrutura do Supabase Storage
O sistema utiliza um bucket privado chamado `study-materials`, criado na migration `20261014000001_storage.sql`.

### 1.1. Padrão Estrutural de Paths
```
study-materials/{user_id}/{exam_id}/{subject_slug}/{topic_slug}/{filename}
```

Exemplo real:
```
study-materials/usr_01/exam-camara-2027/direito-constitucional/poder-legislativo/apostila-completa.pdf
```

### 1.2. Políticas de Isolamento RLS (Storage Objects)
- **Leitura (`SELECT`):** Restrita ao próprio `user_id` correspondente ao primeiro segmento do caminho (`(storage.foldername(name))[1] = auth.uid()::text`);
- **Escrita (`INSERT` / `UPDATE` / `DELETE`):** Somente o proprietário autenticado pode enviar, atualizar ou apagar arquivos da sua pasta;
- **Tamanho Máximo por Arquivo:** $100\text{ MB}$;
- **Tipos MIME Permitidos:** `application/pdf`.

---

## 2. Mapeamento Tópico &rarr; Material de Estudo
Cada tópico no banco possui exatamente um registro inicial correspondente na tabela `study_materials`, com status `PENDING`.

### Campos da Tabela `study_materials`:
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `uuid` | Identificador único do material |
| `user_id` | `uuid` | Chave estrangeira do usuário |
| `topic_id` | `uuid` | Chave estrangeira do tópico correspondente |
| `title` | `text` | Título padronizado (ex: *"PDF completo — Poder Legislativo"*) |
| `material_type` | `text` | `FULL_PDF` (HIGH), `SIMPLIFIED_PDF` (MEDIUM) ou `SUMMARY` (LOW) |
| `storage_path` | `text` | Caminho relativo dentro do bucket |
| `file_url` | `text` | URL de download assinada (signed URL) |
| `file_name` | `text` | Nome original do arquivo (ex: `aula-01-legislativo.pdf`) |
| `mime_type` | `text` | `application/pdf` |
| `file_size` | `bigint`| Tamanho em bytes |
| `page_count` | `integer`| Número total de páginas extraído do arquivo |
| `status` | `text` | `PENDING` (aguardando) &rarr; `AVAILABLE` (disponível para leitura) |
| `version` | `integer`| Número da versão (default: 1) |

---

## 3. Fluxo de Importação e Upload

### Passo 1: Leitura do Edital e Identificação do Tópico
O script ou pipeline recebe o arquivo PDF e identifica a disciplina e o slug do tópico (ex: `direito-administrativo` / `licitacoes-visao-geral`).

### Passo 2: Extração de Metadados
1. Validar que o arquivo é um PDF íntegro (`application/pdf`);
2. Extrair o número total de páginas (`page_count`) via `pdfjs-dist` ou biblioteca de parsing;
3. Calcular hash SHA-256 para controle de versão e deduplicação.

### Passo 3: Envio para o Supabase Storage
1. Para arquivos até $6\text{ MB}$, utilizar upload direto via `@supabase/supabase-js`;
2. Para arquivos maiores ($> 6\text{ MB}$), utilizar upload resumable (TUS protocol) suportado pelo Supabase Storage;
3. Destino: `/{user_id}/{exam_id}/{subject_slug}/{topic_slug}/{filename}`.

### Passo 4: Atualização de Status no Banco de Dados
Executar `UPDATE` atômico na tabela `study_materials`:
```sql
UPDATE public.study_materials
SET
  storage_path = '...',
  file_name = '...',
  file_size = ...,
  page_count = ...,
  status = 'AVAILABLE',
  updated_at = now()
WHERE topic_id = '...' AND user_id = '...';
```

### Passo 5: Atualização Automática da Interface
Assim que `status = 'AVAILABLE'`, a interface da **Biblioteca** e do **Leitor de PDF** habilita imediatamente:
1. Renderização do documento no `/estudar/[topicId]`;
2. Navegação de páginas (1 de Y);
3. Anotações por página;
4. Marcadores de página (bookmarks);
5. Acompanhamento de porcentagem de leitura no `material_progress`.
