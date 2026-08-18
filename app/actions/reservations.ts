'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/dal/admin-session'
import { getGuestSession } from '@/lib/dal/guest-session'
import { createReservationSchema, reservationIdSchema } from '@/lib/validations/reservation'

export type ReservationActionState = { error?: string; success?: boolean } | undefined

// Traduz os códigos de erro levantados pelas RPCs (RAISE EXCEPTION) em
// mensagens que fazem sentido pro convidado/admin — mantido num único lugar
// pra não espalhar essa tradução pela UI.
const ERROR_MESSAGES: Record<string, string> = {
  insufficient_stock: 'Esse item acabou de ser reservado por outra pessoa. Escolha outro.',
  item_missing_price: 'Este item ainda não tem valor definido para PIX.',
  guest_event_mismatch: 'Sua identificação não é válida para este evento.',
  list_inactive: 'Esta lista não está mais disponível.',
  item_not_found: 'Item não encontrado.',
  invalid_fulfillment_method_for_list: 'Forma de presente inválida para este item.',
  guest_not_found: 'Sua identificação expirou. Identifique-se novamente.',
  reservation_not_found: 'Reserva não encontrada.',
  already_cancelled: 'Esta reserva já estava cancelada.',
  not_authorized: 'Você não tem permissão para esta ação.',
  invalid_state: 'Esta reserva não pode ser confirmada no estado atual.',
}

function friendlyError(message: string) {
  return ERROR_MESSAGES[message] ?? 'Não foi possível concluir agora. Tente de novo.'
}

/**
 * Cria uma reserva para o convidado identificado na sessão atual.
 * guest_id vem do cookie assinado do servidor, NUNCA de um campo de
 * formulário — não confiamos em guest_id vindo do cliente (o cookie em si
 * também não é usado como autorização, só resolve "de qual identificação
 * estamos falando"; a RPC valida guest→evento/item→evento no banco).
 */
export async function createReservation(
  _prevState: ReservationActionState,
  formData: FormData
): Promise<ReservationActionState> {
  const guestSession = await getGuestSession()
  if (!guestSession) {
    return { error: 'Identifique-se antes de reservar.' }
  }

  const parsed = createReservationSchema.safeParse({
    itemId: formData.get('itemId'),
    quantity: Number(formData.get('quantity')),
    fulfillmentMethod: formData.get('fulfillmentMethod'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { itemId, quantity, fulfillmentMethod } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.rpc('create_reservation', {
    p_item_id: itemId,
    p_guest_id: guestSession.guestId,
    p_quantity: quantity,
    p_fulfillment_method: fulfillmentMethod,
  })

  if (error) {
    return { error: friendlyError(error.message) }
  }

  revalidatePath('/cha-de-cozinha')
  revalidatePath('/casamento')
  return { success: true }
}

/** Admin confirma um PIX declarado (pending -> confirmed). Não mexe em estoque. */
export async function confirmReservation(
  _prevState: ReservationActionState,
  formData: FormData
): Promise<ReservationActionState> {
  await verifyAdminSession() // redireciona pra /admin/login se não autenticado

  const parsed = reservationIdSchema.safeParse({ reservationId: formData.get('reservationId') })
  if (!parsed.success) {
    return { error: 'Reserva inválida.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('confirm_reservation', {
    p_reservation_id: parsed.data.reservationId,
  })

  if (error) {
    return { error: friendlyError(error.message) }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

/** Admin cancela uma reserva — libera o estoque atomicamente no banco. */
export async function cancelReservation(
  _prevState: ReservationActionState,
  formData: FormData
): Promise<ReservationActionState> {
  await verifyAdminSession()

  const parsed = reservationIdSchema.safeParse({ reservationId: formData.get('reservationId') })
  if (!parsed.success) {
    return { error: 'Reserva inválida.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_reservation', {
    p_reservation_id: parsed.data.reservationId,
  })

  if (error) {
    return { error: friendlyError(error.message) }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}
