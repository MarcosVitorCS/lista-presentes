import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { ReservationRow } from '@/components/admin/ReservationRow'

export default async function AdminReservasPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, guests(name, contact, contact_type), gift_items(name)')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  const all = reservations ?? []
  const pending = all.filter((reservation) => reservation.status === 'pending')
  const others = all.filter((reservation) => reservation.status !== 'pending')

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Reservas pendentes</h2>
          <p className="text-sm text-zinc-500">
            PIX declarado pelo convidado — confirme depois de checar o extrato. Estoque já está
            ocupado desde a criação da reserva, não depende dessa confirmação.
          </p>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma reserva pendente.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900">Histórico</h2>
        {others.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma outra reserva ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {others.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} readOnly />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
