import { StudyMaterial, Topic } from '@/types/database';

export function generateSeedMaterials(topics: Topic[]): StudyMaterial[] {
  return topics.map((t) => {
    let typePrefix = 'PDF completo';
    if (t.recommended_material_type === 'SIMPLIFIED_PDF') {
      typePrefix = 'PDF simplificado';
    } else if (t.recommended_material_type === 'SUMMARY') {
      typePrefix = 'Resumo';
    }

    return {
      id: `mat-${t.id}`,
      user_id: t.user_id,
      topic_id: t.id,
      title: `${typePrefix} — ${t.name}`,
      material_type: t.recommended_material_type,
      storage_path: null,
      file_url: null,
      file_name: null,
      mime_type: 'application/pdf',
      file_size: null,
      page_count: null,
      status: 'PENDING',
      version: 1,
      created_at: '2026-10-14T00:00:00Z',
      updated_at: '2026-10-14T00:00:00Z',
    };
  });
}
