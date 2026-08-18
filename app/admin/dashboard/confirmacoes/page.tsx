import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { InvitationsManager, type GuestRsvpRow } from '@/components/admin/InvitationsManager'
import { Heading, Eyebrow } from '@/components/ui/Heading'
import { Card } from '@/components/ui/Card'

export default async function AdminConfirmacoesPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  // Três queries simples em vez de embed reverso (guests -> rsvp_responses/
  // invitations): evita depender de como o PostgREST detecta cardinalidade
  // 1:1 num FK reverso, e a lista de convidados de um casamento é pequena
  // o suficiente pra isso não pesar.
  const [{ data: guests }, { data: responses }, { data: invitations }] = await Promise.all([
    supabase
      .from('guests')
      .select('id, name, contact, contact_type, max_party_size, created_at')
      .eq('event_id', event.id)
      .not('max_party_size', 'is', null)
      .order('created_at', { ascending: false }),
    supabase.from('rsvp_responses').select('guest_id, status, party_size, responded_at').eq('event_id', event.id),
    supabase.from('invitations').select('guest_id, created_at, last_accessed_at').eq('event_id', event.id),
  ])

  const responseByGuest = new Map((responses ?? []).map((r) => [r.guest_id, r]))
  const invitationByGuest = new Map((invitations ?? []).map((i) => [i.guest_id, i]))

  const rows: GuestRsvpRow[] = (guests ?? []).map((guest) => {
    const rsvp = responseByGuest.get(guest.id)
    const invitation = invitationByGuest.get(guest.id)
    return {
      guestId: guest.id,
      name: guest.name,
      contact: guest.contact,
      contactType: guest.contact_type,
      maxPartySize: guest.max_party_size ?? 1,
      status: (rsvp?.status ?? 'pending') as GuestRsvpRow['status'],
      partySize: rsvp?.party_size ?? null,
      respondedAt: rsvp?.responded_at ?? null,
      lastAccessedAt: invitation?.last_accessed_at ?? null,
    }
  })

  const confirmed = rows.filter((r) => r.status === 'confirmed')
  const declined = rows.filter((r) => r.status === 'declined')
  const pending = rows.filter((r) => r.status === 'pending')
  const confirmedPeople = confirmed.reduce((sum, r) => sum + (r.partySize ?? 0), 0)
  const totalCapacity = rows.reduce((sum, r) => sum + r.maxPartySize, 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Eyebrow>Confirmação de presença</Eyebrow>
        <Heading as="h2" size="md">Convidados</Heading>
        {!event.allow_rsvp && (
          <p className="text-sm text-warning">
            RSVP está desativado nas configurações — os links de convite continuam funcionando, mas
            não há nenhuma chamada visível pra ele na página principal.
          </p>
        )}
      </div>

      <Card className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Convidados" value={rows.length} />
          <Stat label="Confirmados" value={confirmed.length} tone="success" />
          <Stat label="Pendentes" value={pending.length} tone="warning" />
          <Stat label="Recusados" value={declined.length} />
          <Stat label="Pessoas confirmadas" value={confirmedPeople} tone="success" />
          <Stat label="Capacidade convidada" value={totalCapacity} />
        </div>
      </Card>

      <InvitationsManager guests={rows} />
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
