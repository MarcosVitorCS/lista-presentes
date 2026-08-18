import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { hashInviteToken } from '@/lib/rsvp/token'
import type { PartyMemberJson } from '@/types/database'

export type ResolvedInvitation = {
  invitationId: string
  guestId: string
  guestName: string
  eventId: string
  occasionId: string
  partyMembers: PartyMemberJson[]
}

/**
 * Único ponto de leitura de um convite pelo token — usado pela página
 * pública /confirmar/[token]. Hasheia o token e delega tudo (existência,
 * ocasião com RSVP ativo, pessoas autorizadas) pra RPC resolve_invitation
 * (SECURITY DEFINER); retorna null se o convite não existir OU se o RSVP
 * tiver sido desativado pra essa ocasião depois do convite criado — a
 * página trata os dois casos como "não encontrado", sem distinguir motivo.
 */
export async function resolveInvitationByToken(token: string): Promise<ResolvedInvitation | null> {
  const tokenHash = hashInviteToken(token)
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('resolve_invitation', { p_token_hash: tokenHash })
    .maybeSingle()

  if (error || !data) return null

  return {
    invitationId: data.out_invitation_id,
    guestId: data.out_guest_id,
    guestName: data.out_guest_name,
    eventId: data.out_event_id,
    occasionId: data.out_occasion_id,
    partyMembers: data.out_party_members,
  }
}
