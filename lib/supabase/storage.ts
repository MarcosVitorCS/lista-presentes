import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'gift-images'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export class InvalidImageError extends Error {}

/**
 * Envia uma imagem pro bucket público "gift-images", sob a pasta do evento
 * (RLS de storage.objects exige isso — ver migration 00002). Usa o client
 * autenticado do próprio admin (anon key + sessão), nunca service_role.
 */
export async function uploadEventImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipo genérico do supabase-js, evita acoplar a este módulo ao Database completo
  supabase: SupabaseClient<any>,
  eventId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new InvalidImageError('Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.')
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new InvalidImageError('Imagem muito grande (máximo 5MB).')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${eventId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    throw new InvalidImageError('Não foi possível enviar a imagem. Tente novamente.')
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
