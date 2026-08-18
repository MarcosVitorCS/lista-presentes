'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/dal/admin-session'
import { createOccasionSchema, updateOccasionSchema, slugify } from '@/lib/validations/occasion'
import { uploadEventImage, InvalidImageError } from '@/lib/supabase/storage'
import type { Database } from '@/types/database'

type OccasionUpdate = Database['public']['Tables']['event_occasions']['Update']

export type OccasionActionState = { error?: string; success?: boolean } | undefined

/**
 * Mesmo padrão de app/actions/catalog.ts: escrita direta na tabela, RLS
 * (event_occasions_admin_write, migration 00004) restringe ao próprio
 * evento. Sem concorrência envolvida — não precisa de RPC.
 */
export async function createOccasion(
  _prevState: OccasionActionState,
  formData: FormData
): Promise<OccasionActionState> {
  await verifyAdminSession()

  const parsed = createOccasionSchema.safeParse({
    eventId: formData.get('eventId'),
    giftListId: formData.get('giftListId'),
    name: formData.get('name'),
    occasionDate: formData.get('occasionDate'),
    occasionTime: formData.get('occasionTime'),
    locationName: formData.get('locationName'),
    address: formData.get('address'),
    googleMapsUrl: formData.get('googleMapsUrl'),
    description: formData.get('description'),
    displayOrder: formData.get('displayOrder') || 0,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()

  let imageUrl: string | null = null
  const imageFile = formData.get('imageFile')
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imageUrl = await uploadEventImage(supabase, parsed.data.eventId, imageFile)
    } catch (err) {
      return { error: err instanceof InvalidImageError ? err.message : 'Não foi possível enviar a imagem.' }
    }
  }

  const baseSlug = slugify(parsed.data.name) || 'ocasiao'
  const slug = `${baseSlug}-${Date.now().toString(36)}`

  const { error } = await supabase.from('event_occasions').insert({
    event_id: parsed.data.eventId,
    gift_list_id: parsed.data.giftListId ?? null,
    slug,
    name: parsed.data.name,
    occasion_date: parsed.data.occasionDate ?? null,
    occasion_time: parsed.data.occasionTime ?? null,
    location_name: parsed.data.locationName ?? null,
    address: parsed.data.address ?? null,
    google_maps_url: parsed.data.googleMapsUrl ?? null,
    description: parsed.data.description ?? null,
    image_url: imageUrl,
    display_order: parsed.data.displayOrder,
  })

  if (error) {
    return { error: 'Não foi possível criar a ocasião.' }
  }

  revalidatePath('/admin/dashboard/configuracoes')
  revalidatePath('/')
  return { success: true }
}

export async function updateOccasion(
  _prevState: OccasionActionState,
  formData: FormData
): Promise<OccasionActionState> {
  await verifyAdminSession()

  const parsed = updateOccasionSchema.safeParse({
    occasionId: formData.get('occasionId'),
    giftListId: formData.get('giftListId'),
    name: formData.get('name'),
    occasionDate: formData.get('occasionDate'),
    occasionTime: formData.get('occasionTime'),
    locationName: formData.get('locationName'),
    address: formData.get('address'),
    googleMapsUrl: formData.get('googleMapsUrl'),
    description: formData.get('description'),
    displayOrder: formData.get('displayOrder') || 0,
    isActive: formData.get('isActive'),
    allowRsvp: formData.get('allowRsvp'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const eventId = String(formData.get('eventId') ?? '')
  const supabase = await createClient()

  const updates: OccasionUpdate = {
    gift_list_id: parsed.data.giftListId ?? null,
    name: parsed.data.name,
    occasion_date: parsed.data.occasionDate ?? null,
    occasion_time: parsed.data.occasionTime ?? null,
    location_name: parsed.data.locationName ?? null,
    address: parsed.data.address ?? null,
    google_maps_url: parsed.data.googleMapsUrl ?? null,
    description: parsed.data.description ?? null,
    display_order: parsed.data.displayOrder,
    is_active: parsed.data.isActive,
    allow_rsvp: parsed.data.allowRsvp,
  }

  const imageFile = formData.get('imageFile')
  const removeImage = formData.get('removeImage') === 'on'

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!eventId) {
      return { error: 'Evento inválido.' }
    }
    try {
      updates.image_url = await uploadEventImage(supabase, eventId, imageFile)
    } catch (err) {
      return { error: err instanceof InvalidImageError ? err.message : 'Não foi possível enviar a imagem.' }
    }
  } else if (removeImage) {
    updates.image_url = null
  }

  const { error } = await supabase
    .from('event_occasions')
    .update(updates)
    .eq('id', parsed.data.occasionId)

  if (error) {
    return { error: 'Não foi possível salvar a ocasião.' }
  }

  revalidatePath('/admin/dashboard/configuracoes')
  revalidatePath('/')
  return { success: true }
}
