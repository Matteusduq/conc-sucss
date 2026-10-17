import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.AI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);
  const provider = process.env.AI_PROVIDER || (isConfigured ? 'xkiro' : 'none');
  const model = process.env.AI_MODEL || (isConfigured ? 'qwen/qwen3.8-max:free' : 'none');

  // Retorna estritamente metadados públicos seguros. NUNCA a chave.
  return NextResponse.json({
    configured: isConfigured,
    provider,
    model,
  });
}
