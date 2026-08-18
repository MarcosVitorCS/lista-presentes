import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { EventSettingsForm } from '@/components/admin/EventSettingsForm'
import { OccasionsManager } from '@/components/admin/OccasionsManager'
import { Heading } from '@/components/ui/Heading'

export default async function AdminConfiguracoesPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  const [{ data: occasions }, { data: giftLists }] = await Promise.all([
    supabase.from('event_occasions').select('*').eq('event_id', event.id),
    supabase.from('gift_lists').select('id, name').eq('event_id', event.id),
  ])

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-6">
        <div>
          <Heading as="h2" size="md">
            Informações do casamento
          </Heading>
          <p className="mt-1 text-sm text-ink-soft">
            Esses dados aparecem nas páginas públicas e na confirmação de reserva por PIX.
          </p>
        </div>
        <EventSettingsForm event={event} />
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <Heading as="h2" size="md">
            Eventos
          </Heading>
          <p className="mt-1 text-sm text-ink-soft">
            Chá de Cozinha, Casamento — ou qualquer outro momento que vocês queiram anunciar na landing.
          </p>
        </div>
        <OccasionsManager eventId={event.id} occasions={occasions ?? []} giftLists={giftLists ?? []} />
      </div>
    </div>
  )
}
