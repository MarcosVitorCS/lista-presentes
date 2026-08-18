'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/dal/admin-session'
import { createInvitationSchema, regenerateInvitationSchema, submitRsvpSchema } from '@/lib/validations/rsvp'
import { generateInviteToken, hashInviteToken } from '@/lib/rsvp/token'

const RSVP_ERROR_MESSAGES: Record<string, string> = {
  not_authorized: 'Você não tem permissão para esta ação.',
  invalid_name: 'Nome inválido.',
  invalid_contact: 'Contato inválido.',
  invalid_contact_type: 'Tipo de contato inválido.',
  invalid_max_party_size: 'Quantidade máxima inválida (1 a 50 pessoas).',
  invalid_token: 'Não foi possível gerar o convite agora. Tente de novo.',
  invitation_not_found: 'Convite não encontrado ou já foi trocado.',
  guest_not_found: 'Convidado não encontrado.',
  missing_parameters: 'Dados inválidos.',
  invalid_status: 'Resposta inválida.',
  invalid_party_size: 'Quantidade de pessoas inválida para este convite.',
  invalid_notes: 'Observação muito longa.',
}

function friendlyRsvpError(message: string | undefined) {
  return (message && RSVP_ERROR_MESSAGES[message]) ?? 'Não foi possível concluir agora. Tente de novo.'
}

export type CreateInvitationActionState =
  | { error?: string; success?: boolean; inviteToken?: string; guestName?: string }
  | undefined

/**
 * Cria um convite de RSVP (admin). event_id nunca sai do servidor: a RPC
 * create_invitation resolve o evento do próprio admin via event_admins.
 * O token é gerado e hasheado aqui (node:crypto) — a RPC só recebe o hash,
 * nunca o token puro. O token puro só existe nesta resposta, uma vez.
 */
export async function createInvitation(
  _prevState: CreateInvitationActionState,
  formData: FormData
): Promise<CreateInvitationActionState> {
  await verifyAdminSession()

  const parsed = createInvitationSchema.safeParse({
    name: formData.get('name'),
    contact: formData.get('contact'),
    contactType: formData.get('contactType'),
    maxPartySize: formData.get('maxPartySize'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const token = generateInviteToken()
  const tokenHash = hashInviteToken(token)

  const supabase = await createClient()
  const { error } = await supabase.rpc('create_invitation', {
    p_name: parsed.data.name,
    p_contact: parsed.data.contact,
    p_contact_type: parsed.data.contactType,
    p_max_party_size: parsed.data.maxPartySize,
    p_token_hash: tokenHash,
  })

  if (error) {
    return { error: friendlyRsvpError(error.message) }
  }

  revalidatePath('/admin/dashboard/confirmacoes')
  return { success: true, inviteToken: token, guestName: parsed.data.name }
}

export type RegenerateInvitationActionState =
  | { error?: string; success?: boolean; inviteToken?: string }
  | undefined

/** Regenera o convite de um convidado — o link anterior para de funcionar imediatamente. */
export async function regenerateInvitation(
  _prevState: RegenerateInvitationActionState,
  formData: FormData
): Promise<RegenerateInvitationActionState> {
  await verifyAdminSession()

  const parsed = regenerateInvitationSchema.safeParse({ guestId: formData.get('guestId') })
  if (!parsed.success) {
    return { error: 'Convidado inválido.' }
  }

  const token = generateInviteToken()
  const tokenHash = hashInviteToken(token)

  const supabase = await createClient()
  const { error } = await supabase.rpc('regenerate_invitation', {
    p_guest_id: parsed.data.guestId,
    p_token_hash: tokenHash,
  })

  if (error) {
    return { error: friendlyRsvpError(error.message) }
  }

  revalidatePath('/admin/dashboard/confirmacoes')
  return { success: true, inviteToken: token }
}

export type SubmitRsvpActionState =
  | { error?: string; success?: boolean; status?: 'confirmed' | 'declined'; partySize?: number | null }
  | undefined

/**
 * Resposta pública de RSVP. guest_id/event_id nunca vêm do cliente — o
 * token (hasheado aqui) é a única credencial que a RPC aceita.
 */
export async function submitRsvp(
  _prevState: SubmitRsvpActionState,
  formData: FormData
): Promise<SubmitRsvpActionState> {
  const parsed = submitRsvpSchema.safeParse({
    token: formData.get('token'),
    status: formData.get('status'),
    partySize: formData.get('partySize'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const tokenHash = hashInviteToken(parsed.data.token)
  const supabase = await createClient()
  // submit_rsvp retorna public.rsvp_responses (rowtype único, não SETOF) —
  // mesmo padrão de create_reservation/confirm_reservation: `data` já vem
  // como objeto único, sem precisar de .single()/.maybeSingle().
  const { data, error } = await supabase.rpc('submit_rsvp', {
    p_token_hash: tokenHash,
    p_status: parsed.data.status,
    p_party_size: parsed.data.status === 'confirmed' ? parsed.data.partySize ?? null : null,
    p_notes: null,
  })

  if (error || !data) {
    return { error: friendlyRsvpError(error?.message) }
  }

  return { success: true, status: data.status as 'confirmed' | 'declined', partySize: data.party_size }
}
