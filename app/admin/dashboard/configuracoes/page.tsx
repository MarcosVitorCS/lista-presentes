import { getAdminEvent } from '@/lib/dal/admin-session'
import { EventSettingsForm } from '@/components/admin/EventSettingsForm'

export default async function AdminConfiguracoesPage() {
  const event = await getAdminEvent()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Configurações do evento</h2>
        <p className="text-sm text-zinc-500">
          Esses dados aparecem nas páginas públicas e na confirmação de reserva por PIX.
        </p>
      </div>
      <EventSettingsForm event={event} />
    </div>
  )
}
