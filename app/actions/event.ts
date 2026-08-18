'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/dal/admin-session'
import { updateEventSettingsSchema } from '@/lib/validations/event'
import { uploadEventImage, InvalidImageError } from '@/lib/supabase/storage'
import type { Database } from '@/types/database'

type EventUpdate = Database['public']['Tables']['events']['Update']

export type EventActionState = { error?: string; success?: boolean } | undefined

/**
 * Igual ao CRUD de catálogo: passa direto pela tabela (não por RPC).
 * RLS (events_admin_write) já garante que o admin só edita o próprio evento;
 * não há coluna sensível tipo quantity_reserved aqui pra restringir por GRANT.
 */
export async function updateEventSettings(
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  await verifyAdminSession()

  const parsed = updateEventSettingsSchema.safeParse({
    eventId: formData.get('eventId'),
    name: formData.get('name'),
    heroLabel: formData.get('heroLabel'),
    eventDate: formData.get('eventDate'),
    description: formData.get('description'),
    pixKey: formData.get('pixKey'),
    pixKeyType: formData.get('pixKeyType'),
    pixOwnerName: formData.get('pixOwnerName'),
    instagramUrl: formData.get('instagramUrl'),
    facebookUrl: formData.get('facebookUrl'),
    youtubeUrl: formData.get('youtubeUrl'),
    whatsappUrl: formData.get('whatsappUrl'),
    allowRsvp: formData.get('allowRsvp'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()

  const updates: EventUpdate = {
    name: parsed.data.name,
    hero_label: parsed.data.heroLabel,
    event_date: parsed.data.eventDate ?? null,
    description: parsed.data.description ?? null,
    pix_key: parsed.data.pixKey ?? null,
    pix_key_type: parsed.data.pixKeyType ?? null,
    pix_owner_name: parsed.data.pixOwnerName ?? null,
    instagram_url: parsed.data.instagramUrl ?? null,
    facebook_url: parsed.data.facebookUrl ?? null,
    youtube_url: parsed.data.youtubeUrl ?? null,
    whatsapp_url: parsed.data.whatsappUrl ?? null,
    allow_rsvp: parsed.data.allowRsvp,
  }

  const qrFile = formData.get('pixQrCodeFile')
  const removeQr = formData.get('removePixQrCode') === 'on'

  if (qrFile instanceof File && qrFile.size > 0) {
    try {
      updates.pix_qr_code_url = await uploadEventImage(supabase, parsed.data.eventId, qrFile)
    } catch (err) {
      return { error: err instanceof InvalidImageError ? err.message : 'Não foi possível enviar o QR Code.' }
    }
  } else if (removeQr) {
    updates.pix_qr_code_url = null
  }
  // Sem arquivo novo nem "remover" marcado: pix_qr_code_url não entra no
  // update, o QR Code atual permanece intacto.

  const heroFile = formData.get('imageFile')
  const removeHero = formData.get('removeImage') === 'on'

  if (heroFile instanceof File && heroFile.size > 0) {
    try {
      updates.image_url = await uploadEventImage(supabase, parsed.data.eventId, heroFile)
    } catch (err) {
      return { error: err instanceof InvalidImageError ? err.message : 'Não foi possível enviar a imagem.' }
    }
  } else if (removeHero) {
    updates.image_url = null
  }

  const { error } = await supabase.from('events').update(updates).eq('id', parsed.data.eventId)

  if (error) {
    return { error: 'Não foi possível salvar as configurações.' }
  }

  revalidatePath('/admin/dashboard', 'layout')
  revalidatePath('/')
  revalidatePath('/cha-de-cozinha')
  revalidatePath('/casamento')
  return { success: true }
}
