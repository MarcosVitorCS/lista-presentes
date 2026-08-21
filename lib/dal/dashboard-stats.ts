import 'server-only'
import type { createClient } from '@/lib/supabase/server'
import type { RsvpStatus } from '@/types/database'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Agregações do dashboard administrativo — tudo em JS reduce sobre queries
 * simples via RLS normal (mesmo padrão de segurança de todo o admin: sem
 * service_role, sem bypass). Nenhuma view/RPC nova: o volume por evento
 * (dezenas a poucas centenas de linhas) não justifica mover isso pro banco —
 * gift_items_public existe por motivo de PRIVACIDADE pro público (esconder
 * quantity_total/quantity_reserved de anon), não de performance; o admin lê
 * a tabela base direto porque RLS via event_admins já resolve o acesso.
 *
 * Cada função abaixo paraleliza suas próprias queries internamente. A página
 * que chama estas funções deve, por sua vez, chamá-las todas dentro de um
 * único Promise.all — nunca em await sequencial, senão reintroduz o
 * waterfall que o dashboard já evitava antes desta rodada.
 */

// ---------- Presentes ----------

export type ListProgress = { id: string; name: string; total: number; reserved: number; pct: number }
export type TopItem = { id: string; name: string; reserved: number }

export type GiftStats = {
  totalUnits: number
  reservedUnits: number
  availableUnits: number
  reservedPct: number
  byList: ListProgress[]
  topItems: TopItem[]
}

export async function getGiftStats(supabase: SupabaseClient, eventId: string): Promise<GiftStats> {
  const [{ data: items }, { data: lists }] = await Promise.all([
    supabase
      .from('gift_items')
      .select('id, name, list_id, quantity_total, quantity_reserved')
      .eq('event_id', eventId),
    supabase.from('gift_lists').select('id, name').eq('event_id', eventId).eq('is_active', true),
  ])

  const allItems = items ?? []
  const totalUnits = allItems.reduce((sum, item) => sum + item.quantity_total, 0)
  const reservedUnits = allItems.reduce((sum, item) => sum + item.quantity_reserved, 0)
  const availableUnits = totalUnits - reservedUnits
  const reservedPct = totalUnits > 0 ? Math.round((reservedUnits / totalUnits) * 100) : 0

  const byList: ListProgress[] = (lists ?? []).map((list) => {
    const listItems = allItems.filter((item) => item.list_id === list.id)
    const total = listItems.reduce((sum, item) => sum + item.quantity_total, 0)
    const reserved = listItems.reduce((sum, item) => sum + item.quantity_reserved, 0)
    return {
      id: list.id,
      name: list.name,
      total,
      reserved,
      pct: total > 0 ? Math.round((reserved / total) * 100) : 0,
    }
  })

  const topItems: TopItem[] = allItems
    .filter((item) => item.quantity_reserved > 0)
    .slice()
    .sort((a, b) => b.quantity_reserved - a.quantity_reserved)
    .slice(0, 5)
    .map((item) => ({ id: item.id, name: item.name, reserved: item.quantity_reserved }))

  return { totalUnits, reservedUnits, availableUnits, reservedPct, byList, topItems }
}

// ---------- Financeiro ----------
// null = omitir a seção inteira (sem reserva PIX nenhuma, nada de zero sem
// contexto). Filtra por fulfillment_method='pix' explicitamente em vez de
// confiar só em status='pending' implicar PIX — create_reservation (RPC)
// sempre grava declared_amount=null pra reserva física, então o filtro por
// fulfillment_method é a checagem mais robusta e auto-documentada.

export type FinancialStats = {
  totalDeclared: number
  confirmedValue: number
  pendingValue: number
  pendingCount: number
}

export async function getFinancialStats(
  supabase: SupabaseClient,
  eventId: string
): Promise<FinancialStats | null> {
  const { data } = await supabase
    .from('reservations')
    .select('declared_amount, status')
    .eq('event_id', eventId)
    .eq('fulfillment_method', 'pix')
    .neq('status', 'cancelled')

  const rows = data ?? []
  if (rows.length === 0) return null

  let totalDeclared = 0
  let confirmedValue = 0
  let pendingValue = 0
  let pendingCount = 0
  for (const row of rows) {
    const amount = row.declared_amount ?? 0
    totalDeclared += amount
    if (row.status === 'confirmed') confirmedValue += amount
    if (row.status === 'pending') {
      pendingValue += amount
      pendingCount += 1
    }
  }

  return { totalDeclared, confirmedValue, pendingValue, pendingCount }
}

// ---------- RSVP ----------
// null = nenhuma ocasião com allow_rsvp ativado, seção inteira omitida.

export type OccasionRsvp = {
  occasionId: string
  name: string
  invited: number
  confirmed: number
  pending: number
  declined: number
  peopleConfirmed: number
  peopleInvited: number
  pct: number
}

export type RsvpStats = {
  occasions: OccasionRsvp[]
  totalInvited: number
  totalConfirmed: number
  totalPending: number
  totalDeclined: number
  totalPeopleConfirmed: number
  totalPeopleInvited: number
  pct: number
}

export async function getRsvpStats(supabase: SupabaseClient, eventId: string): Promise<RsvpStats | null> {
  const { data: rsvpOccasions } = await supabase
    .from('event_occasions')
    .select('id, name')
    .eq('event_id', eventId)
    .eq('allow_rsvp', true)
    .order('display_order')

  const occasionsList = rsvpOccasions ?? []
  if (occasionsList.length === 0) return null

  const occasionIds = occasionsList.map((occasion) => occasion.id)

  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, occasion_id')
    .in('occasion_id', occasionIds)

  const invitationRows = invitations ?? []
  const invitationIds = invitationRows.map((invitation) => invitation.id)

  const { data: members } = invitationIds.length
    ? await supabase.from('rsvp_party_members').select('invitation_id, status').in('invitation_id', invitationIds)
    : { data: [] as Array<{ invitation_id: string; status: RsvpStatus }> }

  const membersByInvitation = new Map<string, RsvpStatus[]>()
  for (const member of members ?? []) {
    const list = membersByInvitation.get(member.invitation_id) ?? []
    list.push(member.status)
    membersByInvitation.set(member.invitation_id, list)
  }

  // Status do convite derivado a partir dos membros — mesma lógica já usada
  // em app/admin/dashboard/confirmacoes/page.tsx: ninguém respondeu ainda →
  // pending; algum confirmou → confirmed; todos responderam sem nenhum
  // confirmado → declined.
  function statusFor(invitationId: string) {
    const statuses = membersByInvitation.get(invitationId) ?? []
    const confirmedCount = statuses.filter((status) => status === 'confirmed').length
    const allResponded = statuses.length > 0 && statuses.every((status) => status !== 'pending')
    const status: RsvpStatus = !allResponded ? 'pending' : confirmedCount > 0 ? 'confirmed' : 'declined'
    return { status, confirmedCount, total: statuses.length }
  }

  const occasions: OccasionRsvp[] = occasionsList.map((occasion) => {
    const invIds = invitationRows
      .filter((invitation) => invitation.occasion_id === occasion.id)
      .map((invitation) => invitation.id)

    let confirmed = 0
    let pending = 0
    let declined = 0
    let peopleConfirmed = 0
    let peopleInvited = 0
    for (const invId of invIds) {
      const result = statusFor(invId)
      if (result.status === 'confirmed') confirmed += 1
      else if (result.status === 'pending') pending += 1
      else declined += 1
      peopleConfirmed += result.confirmedCount
      peopleInvited += result.total
    }

    return {
      occasionId: occasion.id,
      name: occasion.name,
      invited: invIds.length,
      confirmed,
      pending,
      declined,
      peopleConfirmed,
      peopleInvited,
      pct: invIds.length > 0 ? Math.round((confirmed / invIds.length) * 100) : 0,
    }
  })

  const totalInvited = occasions.reduce((sum, o) => sum + o.invited, 0)
  const totalConfirmed = occasions.reduce((sum, o) => sum + o.confirmed, 0)

  return {
    occasions,
    totalInvited,
    totalConfirmed,
    totalPending: occasions.reduce((sum, o) => sum + o.pending, 0),
    totalDeclined: occasions.reduce((sum, o) => sum + o.declined, 0),
    totalPeopleConfirmed: occasions.reduce((sum, o) => sum + o.peopleConfirmed, 0),
    totalPeopleInvited: occasions.reduce((sum, o) => sum + o.peopleInvited, 0),
    pct: totalInvited > 0 ? Math.round((totalConfirmed / totalInvited) * 100) : 0,
  }
}

// ---------- Contagem regressiva ----------
// null = sem nenhuma data futura (nem ocasião, nem events.event_date) —
// omitir a linha de "faltam N dias" em vez de mostrar dias negativos.

export type EventTiming = { label: string; date: string; daysRemaining: number }

export async function getEventTiming(
  supabase: SupabaseClient,
  event: { id: string; event_date: string | null }
): Promise<EventTiming | null> {
  const { data: occasions } = await supabase
    .from('event_occasions')
    .select('name, occasion_date')
    .eq('event_id', event.id)
    .eq('is_active', true)
    .not('occasion_date', 'is', null)
    .order('occasion_date', { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const future = (occasions ?? [])
    .filter(
      (occasion): occasion is { name: string; occasion_date: string } =>
        occasion.occasion_date != null && new Date(`${occasion.occasion_date}T00:00:00`) >= today
    )
    .sort((a, b) => (a.occasion_date < b.occasion_date ? -1 : 1))

  const next = future[0]
  if (next) {
    const days = Math.round(
      (new Date(`${next.occasion_date}T00:00:00`).getTime() - today.getTime()) / 86_400_000
    )
    return { label: next.name, date: next.occasion_date, daysRemaining: days }
  }

  if (event.event_date) {
    const eventDate = new Date(`${event.event_date}T00:00:00`)
    if (eventDate >= today) {
      const days = Math.round((eventDate.getTime() - today.getTime()) / 86_400_000)
      return { label: 'evento', date: event.event_date, daysRemaining: days }
    }
  }

  return null
}
