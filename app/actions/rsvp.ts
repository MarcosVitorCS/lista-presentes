'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/dal/admin-session'
import {
  createInvitationSchema,
  regenerateInvitationSchema,
  deleteInvitationSchema,
  addPartyMemberSchema,
  removePartyMemberSchema,
  renamePartyMemberSchema,
  submitRsvpSchema,
} from '@/lib/validations/rsvp'
import { generateInviteToken, hashInviteToken } from '@/lib/rsvp/token'
import type { PartyMemberJson } from '@/types/database'

const RSVP_ERROR_MESSAGES: Record<string, string> = {
  not_authorized: 'Você não tem permissão para esta ação.',
  invalid_name: 'Nome inválido.',
  invalid_contact: 'Contato inválido.',
  invalid_contact_type: 'Tipo de contato inválido.',
  invalid_token: 'Não foi possível gerar o convite agora. Tente de novo.',
  invitation_not_found: 'Convite não encontrado ou já foi trocado.',
  invitation_already_exists: 'Este convidado já tem um convite para esta ocasião.',
  occasion_not_found: 'Ocasião não encontrada.',
  rsvp_disabled_for_occasion: 'A confirmação de presença está desativada para esta ocasião.',
  guest_not_found: 'Convidado não encontrado.',
  member_not_found: 'Pessoa não encontrada neste convite.',
  cannot_remove_primary: 'O responsável pelo convite não pode ser removido.',
  too_many_members: 'Esse convite já atingiu o limite de pessoas.',
  missing_parameters: 'Dados inválidos.',
  invalid_status: 'Resposta inválida.',
  invalid_member_ids: 'Seleção inválida — atualize a página e tente de novo.',
}

function friendlyRsvpError(message: string | undefined) {
  return (message && RSVP_ERROR_MESSAGES[message]) ?? 'Não foi possível concluir agora. Tente de novo.'
}

export type CreateInvitationActionState =
  | { error?: string; success?: boolean; inviteToken?: string; guestName?: string }
  | undefined

/**
 * Cria um convite de RSVP (admin) para uma ocasião específica. event_id
 * nunca sai do servidor: a RPC create_invitation resolve o evento a partir
 * da ocasião e confere que o admin autenticado o administra, e que a
 * ocasião tem RSVP ativado. O token é gerado e hasheado aqui (node:crypto)
 * — a RPC só recebe o hash. O token puro só existe nesta resposta, uma vez.
 */
export async function createInvitation(
  _prevState: CreateInvitationActionState,
  formData: FormData
): Promise<CreateInvitationActionState> {
  await verifyAdminSession()

  const parsed = createInvitationSchema.safeParse({
    occasionId: formData.get('occasionId'),
    name: formData.get('name'),
    contact: formData.get('contact'),
    contactType: formData.get('contactType'),
    extraMemberNames: formData.getAll('extraMemberName'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const token = generateInviteToken()
  const tokenHash = hashInviteToken(token)

  const supabase = await createClient()
  const { error } = await supabase.rpc('create_invitation', {
    p_occasion_id: parsed.data.occasionId,
    p_name: parsed.data.name,
    p_contact: parsed.data.contact,
    p_contact_type: parsed.data.contactType,
    p_extra_member_names: parsed.data.extraMemberNames,
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

/** Regenera o convite — o link anterior para de funcionar imediatamente. */
export async function regenerateInvitation(
  _prevState: RegenerateInvitationActionState,
  formData: FormData
): Promise<RegenerateInvitationActionState> {
  await verifyAdminSession()

  const parsed = regenerateInvitationSchema.safeParse({ invitationId: formData.get('invitationId') })
  if (!parsed.success) {
    return { error: 'Convite inválido.' }
  }

  const token = generateInviteToken()
  const tokenHash = hashInviteToken(token)

  const supabase = await createClient()
  const { error } = await supabase.rpc('regenerate_invitation', {
    p_invitation_id: parsed.data.invitationId,
    p_token_hash: tokenHash,
  })

  if (error) {
    return { error: friendlyRsvpError(error.message) }
  }

  revalidatePath('/admin/dashboard/confirmacoes')
  return { success: true, inviteToken: token }
}

export type DeleteInvitationActionState = { error?: string; success?: boolean } | undefined

/**
 * Exclui um convite inteiro (e seus rsvp_party_members, via cascade no
 * banco) — pra remover um convite de teste ou criado por engano. Diferente
 * de regenerar (troca só o link, preserva respostas) ou de cancelar uma
 * reserva (soft: linha preservada como histórico): aqui não sobra nada.
 * Não afeta o guest, que pode ter outro convite ou reserva.
 */
export async function deleteInvitation(
  _prevState: DeleteInvitationActionState,
  formData: FormData
): Promise<DeleteInvitationActionState> {
  await verifyAdminSession()

  const parsed = deleteInvitationSchema.safeParse({ invitationId: formData.get('invitationId') })
  if (!parsed.success) {
    return { error: 'Convite inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_invitation', {
    p_invitation_id: parsed.data.invitationId,
  })

  if (error) {
    return { error: friendlyRsvpError(error.message) }
  }

  revalidatePath('/admin/dashboard/confirmacoes')
  return { success: true }
}

export type PartyMemberActionState = { error?: string; success?: boolean } | undefined

/** Adiciona uma pessoa autorizada a um convite já criado. */
export async function addPartyMember(
  _prevState: PartyMemberActionState,
  formData: FormData
): Promise<PartyMemberActionState> {
  await verifyAdminSession()

  const parsed = addPartyMemberSchema.safeParse({
    invitationId: formData.get('invitationId'),
    name: formData.get('name'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('add_party_member', {
    p_invitation_id: parsed.data.invitationId,
    p_name: parsed.data.name,
  })

  if (error) {
    return { error: friendlyRsvpError(error.message) }
  }

  revalidatePath('/admin/dashboard/confirmacoes')
  return { success: true }
}

/** Remove uma pessoa autorizada (nunca o responsável do convite). */
export async function removePartyMember(
  _prevState: PartyMemberActionState,
  formData: FormData
): Promise<PartyMemberActionState> {
  await verifyAdminSession()

  const parsed = removePartyMemberSchema.safeParse({ partyMemberId: formData.get('partyMemberId') })
  if (!parsed.success) {
    return { error: 'Pessoa inválida.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_party_member', {
    p_party_member_id: parsed.data.partyMemberId,
  })

  if (error) {
    return { error: friendlyRsvpError(error.message) }
  }

  revalidatePath('/admin/dashboard/confirmacoes')
  return { success: true }
}

/** Corrige o nome de uma pessoa já cadastrada (inclusive o responsável). */
export async function renamePartyMember(
  _prevState: PartyMemberActionState,
  formData: FormData
): Promise<PartyMemberActionState> {
  await verifyAdminSession()

  const parsed = renamePartyMemberSchema.safeParse({
    partyMemberId: formData.get('partyMemberId'),
    name: formData.get('name'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('rename_party_member', {
    p_party_member_id: parsed.data.partyMemberId,
    p_name: parsed.data.name,
  })

  if (error) {
    return { error: friendlyRsvpError(error.message) }
  }

  revalidatePath('/admin/dashboard/confirmacoes')
  return { success: true }
}

export type SubmitRsvpActionState =
  | { error?: string; success?: boolean; partyMembers?: PartyMemberJson[] }
  | undefined

/**
 * Resposta pública de RSVP. guest_id/event_id/occasion_id nunca vêm do
 * cliente — o token (hasheado aqui) é a única credencial que a RPC aceita.
 * confirmedMemberIds vazio = "não poderei comparecer" (todo mundo fica
 * declined) — a RPC valida que cada id pertence a este convite.
 */
export async function submitRsvp(
  _prevState: SubmitRsvpActionState,
  formData: FormData
): Promise<SubmitRsvpActionState> {
  const parsed = submitRsvpSchema.safeParse({
    token: formData.get('token'),
    confirmedMemberIds: formData.getAll('confirmedMemberId'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const tokenHash = hashInviteToken(parsed.data.token)
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('submit_rsvp', {
      p_token_hash: tokenHash,
      p_confirmed_member_ids: parsed.data.confirmedMemberIds,
    })
    .maybeSingle()

  if (error || !data) {
    return { error: friendlyRsvpError(error?.message) }
  }

  return { success: true, partyMembers: data.out_party_members }
}
