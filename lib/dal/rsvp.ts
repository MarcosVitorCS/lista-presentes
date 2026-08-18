import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { hashInviteToken } from '@/lib/rsvp/token'

export type ResolvedInvitation = {
  guestId: string
  guestName: string
  eventId: string
  maxPartySize: number
  status: 'pending' | 'confirmed' | 'declined'
  partySize: number | null
}

/**
 * Único ponto de leitura de um convite pelo token — usado pela página
 * pública /confirmar/[token]. Hasheia o token e delega tudo (existência,
 * dados do convidado, resposta atual) pra RPC resolve_invitation
 * (SECURITY DEFINER); retorna null se o convite não existir, sem
 * distinguir o motivo (token malformado, revogado ou nunca existiu).
 */
export async function resolveInvitationByToken(token: string): Promise<ResolvedInvitation | null> {
  const tokenHash = hashInviteToken(token)
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('resolve_invitation', { p_token_hash: tokenHash })
    .maybeSingle()

  if (error || !data) return null

  return {
    guestId: data.guest_id,
    guestName: data.guest_name,
    eventId: data.event_id,
    maxPartySize: data.max_party_size,
    status: data.status as ResolvedInvitation['status'],
    partySize: data.party_size,
  }
}
