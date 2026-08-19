import { notFound } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveInvitationByToken } from '@/lib/dal/rsvp'
import { PublicHeader } from '@/components/public/PublicHeader'
import { RsvpForm } from '@/components/public/RsvpForm'
import { Eyebrow, Heading } from '@/components/ui/Heading'

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
 *
 * O convite pertence a UMA ocasião específica (invitation.occasion_id) — as
 * informações mostradas aqui (data/hora/local) são sempre dessa ocasião.
 */
export default async function ConfirmarPage(props: PageProps<'/confirmar/[token]'>) {
  const { token } = await props.params
  const invitation = await resolveInvitationByToken(token)

  // Erro genérico independente do motivo (token malformado, revogado, nunca
  // existiu, ou RSVP desativado para a ocasião depois do convite criado) —
  // não revela nada sobre convites de outras pessoas.
  if (!invitation) notFound()

  const supabase = await createClient()
  const [{ data: event }, { data: occasion }] = await Promise.all([
    supabase.from('events').select('name, hero_label').eq('id', invitation.eventId).maybeSingle(),
    supabase
      .from('event_occasions')
      .select('name, occasion_date, occasion_time, location_name')
      .eq('id', invitation.occasionId)
      .maybeSingle(),
  ])

  if (!event) notFound()

  const date = formatDate(occasion?.occasion_date ?? null)
  const time = formatTime(occasion?.occasion_time ?? null)
  const firstName = invitation.guestName.trim().split(' ')[0]

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 py-12 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-2 text-center">
          <Eyebrow>{occasion?.name ?? event.hero_label}</Eyebrow>
          {/* Heading do kit em vez de h1 solto: o tamanho vem da escala
              tipográfica, e o convite passa a ter a mesma voz das outras
              telas públicas. */}
          <Heading as="h1" size="lg">
            Olá, {firstName}! 👋
          </Heading>
          <p className="text-body-md text-ink-soft">Será uma alegria ter você conosco.</p>
        </div>

        <div className="flex flex-col gap-1 rounded-[var(--radius-lg)] border border-canvas-line bg-canvas-alt p-5 text-center">
          <p className="font-display text-xl italic text-ink">{event.name}</p>
          {(date || time) && (
            <p className="text-caption text-ink-soft">
              {date}
              {date && time && ' · '}
              {time}
            </p>
          )}
          {occasion?.location_name && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-caption text-ink-soft">
              <MapPin size={14} strokeWidth={1.8} aria-hidden="true" />
              {occasion.location_name}
            </p>
          )}
        </div>

        <RsvpForm token={token} partyMembers={invitation.partyMembers} />
      </main>
    </>
  )
}
