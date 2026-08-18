import Link from 'next/link'
import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { InvitationsManager, type InvitationRowData } from '@/components/admin/InvitationsManager'
import { OccasionRsvpSelect } from '@/components/admin/OccasionRsvpSelect'
import { Heading, Eyebrow } from '@/components/ui/Heading'
import { Card } from '@/components/ui/Card'
import type { RsvpStatus } from '@/types/database'

export default async function AdminConfirmacoesPage(props: PageProps<'/admin/dashboard/confirmacoes'>) {
  const event = await getAdminEvent()
  const supabase = await createClient()
  const searchParams = await props.searchParams
  const occasionParam = typeof searchParams.occasion === 'string' ? searchParams.occasion : undefined

  // Só ocasiões com RSVP ativado aparecem aqui — cada uma tem seu próprio
  // conjunto de convites (migration 00007: invitations agora pertence a
  // uma ocasião, não mais ao evento como um todo).
  const { data: rsvpOccasions } = await supabase
    .from('event_occasions')
    .select('id, name')
    .eq('event_id', event.id)
    .eq('allow_rsvp', true)
    .order('display_order')

  const occasions = rsvpOccasions ?? []

  if (occasions.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Eyebrow>Confirmação de presença</Eyebrow>
        <Heading as="h2" size="md">Convidados</Heading>
        <p className="text-sm text-ink-soft">
          Nenhuma ocasião com confirmação de presença ativada ainda. Ative em{' '}
          <Link href="/admin/dashboard/configuracoes" className="text-accent-text underline underline-offset-2">
            Configurações → Eventos
          </Link>
          , no card da ocasião que deve ter RSVP.
        </p>
      </div>
    )
  }

  const selectedOccasionId = occasions.some((o) => o.id === occasionParam) ? occasionParam! : occasions[0].id

  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, guest_id, last_accessed_at, guests(name, contact, contact_type)')
    .eq('occasion_id', selectedOccasionId)
    .order('created_at', { ascending: false })

  const invitationIds = (invitations ?? []).map((inv) => inv.id)

  type PartyMemberRow = {
    id: string
    invitation_id: string
    name: string
    is_primary: boolean
    status: RsvpStatus
  }

  const { data: members } = invitationIds.length
    ? await supabase
        .from('rsvp_party_members')
        .select('id, invitation_id, name, is_primary, status')
        .in('invitation_id', invitationIds)
    : { data: [] as PartyMemberRow[] }

  const membersByInvitation = new Map<string, PartyMemberRow[]>()
  for (const member of members ?? []) {
    const list = membersByInvitation.get(member.invitation_id) ?? []
    list.push(member)
    membersByInvitation.set(member.invitation_id, list)
  }

  const rows: InvitationRowData[] = (invitations ?? []).map((inv) => {
    const invMembers = (membersByInvitation.get(inv.id) ?? [])
      .slice()
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    const confirmedCount = invMembers.filter((m) => m.status === 'confirmed').length
    const allResponded = invMembers.length > 0 && invMembers.every((m) => m.status !== 'pending')
    const status: RsvpStatus = !allResponded ? 'pending' : confirmedCount > 0 ? 'confirmed' : 'declined'

    return {
      invitationId: inv.id,
      guestName: inv.guests?.name ?? '—',
      contact: inv.guests?.contact ?? '',
      lastAccessedAt: inv.last_accessed_at,
      members: invMembers.map((m) => ({ id: m.id, name: m.name, isPrimary: m.is_primary, status: m.status as RsvpStatus })),
      totalAuthorized: invMembers.length,
      confirmedCount,
      status,
    }
  })

  const confirmed = rows.filter((r) => r.status === 'confirmed')
  const declined = rows.filter((r) => r.status === 'declined')
  const pending = rows.filter((r) => r.status === 'pending')
  const peopleConfirmed = rows.reduce((sum, r) => sum + r.confirmedCount, 0)
  const peopleInvited = rows.reduce((sum, r) => sum + r.totalAuthorized, 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Eyebrow>Confirmação de presença</Eyebrow>
          <Heading as="h2" size="md">Convidados</Heading>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="occasion-select" className="text-xs uppercase tracking-[0.08em] text-ink-soft">
            Ocasião
          </label>
          <OccasionRsvpSelect occasions={occasions} selectedId={selectedOccasionId} />
        </div>
      </div>

      <Card className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Convidados responsáveis" value={rows.length} />
          <Stat label="Confirmados" value={confirmed.length} tone="success" />
          <Stat label="Pendentes" value={pending.length} tone="warning" />
          <Stat label="Recusados" value={declined.length} />
          <Stat label="Pessoas confirmadas" value={peopleConfirmed} tone="success" />
        </div>
        <p className="border-t border-canvas-line pt-4 text-sm text-ink-soft">
          {peopleInvited} {peopleInvited === 1 ? 'pessoa convidada' : 'pessoas convidadas'} no total nesta ocasião.
        </p>
      </Card>

      <InvitationsManager occasionId={selectedOccasionId} rows={rows} />
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' }) {
  return (
    <div className="min-w-0">
      <p className={`font-display text-2xl ${tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-ink'}`}>
        {value}
      </p>
      <p className="mt-0.5 break-words text-[10px] uppercase leading-snug tracking-[0.03em] text-ink-soft sm:text-xs sm:tracking-[0.08em]">
        {label}
      </p>
    </div>
  )
}
