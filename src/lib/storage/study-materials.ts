import { createClient } from '@/lib/supabase/client';

export const STUDY_MATERIALS_BUCKET = 'study-materials';

export interface UploadMaterialParams {
  userId: string;
  examId: string;
  subjectSlug: string;
  topicSlug: string;
  file: File;
}

export interface UploadResult {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Faz upload de um arquivo PDF para o bucket privado `study-materials`.
 * O caminho é particionado por usuário: `{user_id}/{exam_id}/{subject_slug}/{topic_slug}/{filename}`
 */
export async function uploadStudyMaterial({
  userId,
  examId,
  subjectSlug,
  topicSlug,
  file,
}: UploadMaterialParams): Promise<UploadResult> {
  const supabase = createClient();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${examId}/${subjectSlug}/${topicSlug}/${Date.now()}_${sanitizedFileName}`;

  const { error } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/pdf',
      upsert: false,
    });

  if (error) {
    throw new Error(`Erro ao fazer upload do material: ${error.message}`);
  }

  return {
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/pdf',
  };
}

/**
 * Substitui um arquivo existente no Storage (upsert = true)
 */
export async function replaceStudyMaterial(
  storagePath: string,
  file: File
): Promise<UploadResult> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`Erro ao substituir material no Storage: ${error.message}`);
  }

  return {
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/pdf',
  };
}

/**
 * Remove um arquivo do bucket privado
 */
export async function deleteStudyMaterial(storagePath: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Erro ao remover material do Storage: ${error.message}`);
  }
}

/**
 * Gera uma Signed URL temporária válida para visualização no navegador.
 * Nunca expõe o arquivo publicamente de forma perene.
 */
export async function getStudyMaterialSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  // Suporte a caminhos estáticos locais para testes e demonstrações de desenvolvimento
  if (
    storagePath.startsWith('/') ||
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://')
  ) {
    return storagePath;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Erro ao gerar link de leitura temporário: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Faz download do blob do arquivo para renderização local segura
 */
export async function downloadStudyMaterial(storagePath: string): Promise<Blob> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(STUDY_MATERIALS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Erro ao baixar material: ${error?.message}`);
  }

  return data;
}
