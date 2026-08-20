'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/dal/admin-session'
import { createGiftItemSchema, updateGiftItemSchema } from '@/lib/validations/catalog'
import { uploadEventImage, InvalidImageError } from '@/lib/supabase/storage'
import type { Database } from '@/types/database'

type GiftItemUpdate = Database['public']['Tables']['gift_items']['Update']

export type CatalogActionState = { error?: string; success?: boolean } | undefined

/**
 * CRUD de catálogo (gift_lists/gift_items) passa direto pela tabela, não por
 * RPC — RLS (event_admins) + GRANT por coluna já garantem que o admin só
 * altera o próprio evento e nunca toca quantity_reserved (ver migration
 * 00001, seção 6: essa coluna nem está na lista de colunas com UPDATE
 * concedido a `authenticated`). Diferente de reservas, aqui não há disputa
 * de concorrência — não precisa de SECURITY DEFINER.
 */

export async function createGiftList(
  _prevState: CatalogActionState,
  formData: FormData
): Promise<CatalogActionState> {
  await verifyAdminSession()

  const eventId = String(formData.get('eventId') ?? '')
  const slug = String(formData.get('slug') ?? '')
  const type = String(formData.get('type') ?? '')
  const name = String(formData.get('name') ?? '')

  if (!eventId || !slug || (type !== 'physical' && type !== 'quota') || !name) {
    return { error: 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('gift_lists')
    .insert({ event_id: eventId, slug, type, name })

  if (error) {
    return { error: 'Não foi possível criar a lista.' }
  }

  revalidatePath('/admin/dashboard', 'layout')
  return { success: true }
}

export async function createGiftItem(
  _prevState: CatalogActionState,
  formData: FormData
): Promise<CatalogActionState> {
  await verifyAdminSession()

  const parsed = createGiftItemSchema.safeParse({
    listId: formData.get('listId'),
    eventId: formData.get('eventId'),
    name: formData.get('name'),
    description: formData.get('description'),
    unitPrice: formData.get('unitPrice'),
    quantityTotal: formData.get('quantityTotal'),
    purchaseUrl: formData.get('purchaseUrl'),
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

  const { error } = await supabase.from('gift_items').insert({
    list_id: parsed.data.listId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    image_url: imageUrl,
    unit_price: parsed.data.unitPrice ?? null,
    quantity_total: parsed.data.quantityTotal,
    purchase_url: parsed.data.purchaseUrl ?? null,
  })

  if (error) {
    return { error: 'Não foi possível criar o item.' }
  }

  revalidatePath('/admin/dashboard', 'layout')
  // 'page' com o padrão de rota dinâmica revalida todas as instâncias
  // (qualquer evento, qualquer lista) numa chamada só — não precisa saber
  // qual slug específico foi afetado.
  revalidatePath('/evento/[slug]/[list]', 'page')
  return { success: true }
}

export async function updateGiftItem(
  _prevState: CatalogActionState,
  formData: FormData
): Promise<CatalogActionState> {
  await verifyAdminSession()

  const parsed = updateGiftItemSchema.safeParse({
    itemId: formData.get('itemId'),
    eventId: formData.get('eventId'),
    name: formData.get('name'),
    description: formData.get('description'),
    unitPrice: formData.get('unitPrice'),
    quantityTotal: formData.get('quantityTotal'),
    isActive: formData.get('isActive'),
    purchaseUrl: formData.get('purchaseUrl'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()

  const updates: GiftItemUpdate = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    unit_price: parsed.data.unitPrice ?? null,
    quantity_total: parsed.data.quantityTotal,
    is_active: parsed.data.isActive,
    purchase_url: parsed.data.purchaseUrl ?? null,
  }

  const imageFile = formData.get('imageFile')
  const removeImage = formData.get('removeImage') === 'on'

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      updates.image_url = await uploadEventImage(supabase, parsed.data.eventId, imageFile)
    } catch (err) {
      return { error: err instanceof InvalidImageError ? err.message : 'Não foi possível enviar a imagem.' }
    }
  } else if (removeImage) {
    updates.image_url = null
  }
  // Se nem arquivo novo nem "remover" foram marcados, image_url não entra no
  // update — a imagem atual (se houver) permanece intacta.

  const { error } = await supabase.from('gift_items').update(updates).eq('id', parsed.data.itemId)

  if (error) {
    // Provavelmente a CHECK quantity_reserved_le_total (tentou reduzir o
    // total abaixo do que já está reservado) — o Postgres barra isso sozinho.
    return {
      error: 'Não foi possível salvar. A quantidade não pode ficar menor que o já reservado.',
    }
  }

  revalidatePath('/admin/dashboard', 'layout')
  // 'page' com o padrão de rota dinâmica revalida todas as instâncias
  // (qualquer evento, qualquer lista) numa chamada só — não precisa saber
  // qual slug específico foi afetado.
  revalidatePath('/evento/[slug]/[list]', 'page')
  return { success: true }
}
