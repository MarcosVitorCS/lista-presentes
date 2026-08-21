import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { ReservationRow } from '@/components/admin/ReservationRow'
import { Badge } from '@/components/ui/Badge'
import { Heading } from '@/components/ui/Heading'
import { PageHeader } from '@/components/ui/PageHeader'

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
    <div className="flex flex-col gap-[var(--spacing-section)]">
      <div className="flex flex-col gap-4">
        <PageHeader
          titleAs="h2"
          eyebrow="Reservas"
          title="Pendentes de confirmação"
          description="PIX declarado pelo convidado — confirme depois de checar o extrato. O estoque já está ocupado desde a criação da reserva, não depende dessa confirmação."
          action={
            pending.length > 0 ? (
              <Badge tone="warning">{pending.length} aguardando</Badge>
            ) : null
          }
        />
        {pending.length === 0 ? (
          <EmptyRow message="Nenhuma reserva pendente." />
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Heading as="h2" size="sm">
          Histórico
        </Heading>
        {others.length === 0 ? (
          <EmptyRow message="Nenhuma outra reserva ainda." />
        ) : (
          <div className="flex flex-col gap-3">
            {others.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Mesma superfície tracejada do EmptyState público, mas local: o vazio do
 * admin não tem ação e não vale acoplar uma tela de admin a components/public.
 */
function EmptyRow({ message }: { message: string }) {
  return (
    <p className="rounded-[var(--radius-lg)] border border-dashed border-canvas-line bg-canvas-alt px-5 py-8 text-center text-body-md text-ink-soft">
      {message}
    </p>
  )
}
