import { notFound } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveInvitationByToken } from '@/lib/dal/rsvp'
import { PublicHeader } from '@/components/public/PublicHeader'
import { RsvpForm } from '@/components/public/RsvpForm'
import { Eyebrow } from '@/components/ui/Heading'

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null
}

/**
 * Fluxo público de RSVP — inteiramente separado do fluxo de reserva de
 * presentes (identificação por cookie, gift_items etc.): aqui a única
 * credencial é o token na URL. Nenhuma leitura/escrita deste arquivo toca
 * guests/reservations diretamente — tudo passa por resolveInvitationByToken
 * (RPC resolve_invitation) e pela action submitRsvp (RPC submit_rsvp).
 */
export default async function ConfirmarPage(props: PageProps<'/confirmar/[token]'>) {
  const { token } = await props.params
  const invitation = await resolveInvitationByToken(token)

  // Erro genérico independente do motivo (token malformado, revogado ou
  // nunca existiu) — não revela nada sobre convites de outras pessoas.
  if (!invitation) notFound()

  const supabase = await createClient()
  const [{ data: event }, { data: occasions }] = await Promise.all([
    supabase.from('events').select('name, hero_label').eq('id', invitation.eventId).maybeSingle(),
    supabase
      .from('event_occasions')
      .select('name, occasion_date, occasion_time, location_name')
      .eq('event_id', invitation.eventId)
      .eq('is_active', true)
      .order('display_order')
      .limit(1),
  ])

  if (!event) notFound()

  const occasion = occasions?.[0] ?? null
  const date = formatDate(occasion?.occasion_date ?? null)
  const time = formatTime(occasion?.occasion_time ?? null)
  const firstName = invitation.guestName.trim().split(' ')[0]

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-2 text-center">
          <Eyebrow>{event.hero_label}</Eyebrow>
          <h1 className="font-display text-3xl text-ink">Olá, {firstName}! 👋</h1>
          <p className="text-ink-soft">Você está convidado para participar do nosso evento.</p>
        </div>

        <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-canvas-line bg-canvas-alt p-5 text-center">
          <p className="font-display text-xl italic text-ink">{event.name}</p>
          {(date || time) && (
            <p className="text-sm text-ink-soft">
              {date}
              {date && time && ' · '}
              {time}
            </p>
          )}
          {occasion?.location_name && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-ink-soft">
              <MapPin size={14} strokeWidth={1.8} aria-hidden="true" />
              {occasion.location_name}
            </p>
          )}
          <p className="mt-3 border-t border-canvas-line pt-3 text-xs text-ink-soft">
            Convite válido para até {invitation.maxPartySize}{' '}
            {invitation.maxPartySize === 1 ? 'pessoa' : 'pessoas'}.
          </p>
        </div>

        <RsvpForm
          token={token}
          maxPartySize={invitation.maxPartySize}
          initialStatus={invitation.status}
          initialPartySize={invitation.partySize}
        />
      </main>
    </>
  )
}
