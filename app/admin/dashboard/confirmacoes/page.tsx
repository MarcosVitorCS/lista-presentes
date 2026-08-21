import Link from 'next/link'
import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { InvitationsManager, type InvitationRowData } from '@/components/admin/InvitationsManager'
import { OccasionRsvpSelect } from '@/components/admin/OccasionRsvpSelect'
import { Card } from '@/components/ui/Card'
import { Label } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stat } from '@/components/ui/Stat'
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
      <div className="flex flex-col gap-6">
        <PageHeader titleAs="h2" eyebrow="Confirmação de presença" title="Convidados" />
        <p className="rounded-[var(--radius-lg)] border border-dashed border-canvas-line bg-canvas-alt px-5 py-8 text-center text-body-md text-ink-soft">
          Nenhuma ocasião com confirmação de presença ativada ainda. Ative em{' '}
          <Link
            href="/admin/dashboard/configuracoes"
            className="text-accent-text underline underline-offset-2"
          >
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
      <PageHeader
        titleAs="h2"
        eyebrow="Confirmação de presença"
        title="Convidados"
        action={
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="occasion-select">Ocasião</Label>
            <OccasionRsvpSelect occasions={occasions} selectedId={selectedOccasionId} />
          </div>
        }
      />

      <Card elevation="raise" className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Convidados responsáveis" value={rows.length} size="md" />
          <Stat label="Confirmados" value={confirmed.length} tone="success" size="md" />
          <Stat label="Pendentes" value={pending.length} tone="warning" size="md" />
          <Stat label="Recusados" value={declined.length} size="md" />
          <Stat label="Pessoas confirmadas" value={peopleConfirmed} tone="success" size="md" />
        </div>
        <p className="border-t border-canvas-line pt-4 text-caption text-ink-soft">
          <span className="tabular-nums">{peopleInvited}</span>{' '}
          {peopleInvited === 1 ? 'pessoa convidada' : 'pessoas convidadas'} no total nesta ocasião.
        </p>
      </Card>

      <InvitationsManager occasionId={selectedOccasionId} rows={rows} />
    </div>
  )
}
