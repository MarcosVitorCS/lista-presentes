import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { EventSettingsForm } from '@/components/admin/EventSettingsForm'
import { OccasionsManager } from '@/components/admin/OccasionsManager'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function AdminConfiguracoesPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  const [{ data: occasions }, { data: giftLists }] = await Promise.all([
    supabase.from('event_occasions').select('*').eq('event_id', event.id),
    supabase.from('gift_lists').select('id, name').eq('event_id', event.id),
  ])

  return (
    <div className="flex flex-col gap-[var(--spacing-section)]">
      <div className="flex flex-col gap-6">
        <PageHeader
          titleAs="h2"
          eyebrow="Configurações"
          title="Informações do casamento"
          description="Esses dados aparecem nas páginas públicas e na confirmação de reserva por PIX."
        />
        <EventSettingsForm event={event} />
      </div>

      <div className="flex flex-col gap-6">
        <PageHeader
          titleAs="h2"
          eyebrow="Configurações"
          title="Eventos"
          description="Chá de Cozinha, Casamento — ou qualquer outro momento que vocês queiram anunciar na landing."
        />
        <OccasionsManager eventId={event.id} occasions={occasions ?? []} giftLists={giftLists ?? []} />
      </div>
    </div>
  )
}
