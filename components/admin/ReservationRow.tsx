'use client'

import { useActionState } from 'react'
import { confirmReservation, cancelReservation } from '@/app/actions/reservations'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useActionToast } from '@/components/ui/Toast'
import type { Database } from '@/types/database'

type ReservationWithRelations = Database['public']['Tables']['reservations']['Row'] & {
  guests: Pick<Database['public']['Tables']['guests']['Row'], 'name' | 'contact' | 'contact_type'> | null
  gift_items: Pick<Database['public']['Tables']['gift_items']['Row'], 'name'> | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
}

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'neutral',
}

function formatPrice(value: number | null) {
  if (value == null) return null
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ReservationRow({
  reservation,
  readOnly = false,
}: {
  reservation: ReservationWithRelations
  readOnly?: boolean
}) {
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmReservation, undefined)
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelReservation, undefined)
  useActionToast(confirmState, 'PIX confirmado!')
  useActionToast(cancelState, 'Reserva cancelada.')
  const busy = confirmPending || cancelPending

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-canvas-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-ink">
          {reservation.gift_items?.name ?? 'Item removido'} · {reservation.quantity}x
        </p>
        <p className="text-sm text-ink-soft">
          {reservation.guests?.name ?? 'Convidado'}
          {reservation.guests?.contact ? ` — ${reservation.guests.contact}` : ''}
        </p>
        <p className="text-xs text-ink-soft">
          {reservation.fulfillment_method === 'pix'
            ? `PIX · ${formatPrice(reservation.declared_amount)}`
            : 'Físico'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[reservation.status]}>{STATUS_LABEL[reservation.status]}</Badge>

        {!readOnly && reservation.status === 'pending' && reservation.fulfillment_method === 'pix' && (
          <form action={confirmAction}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <Button type="submit" variant="solid" size="sm" disabled={busy}>
              {confirmPending ? 'Confirmando…' : 'Confirmar PIX'}
            </Button>
          </form>
        )}

        {!readOnly && reservation.status !== 'cancelled' && (
          <form action={cancelAction}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <Button type="submit" variant="line" size="sm" disabled={busy}>
              {cancelPending ? 'Cancelando…' : 'Cancelar'}
            </Button>
          </form>
        )}
      </div>

      {(confirmState?.error || cancelState?.error) && (
        <p className="text-sm text-danger sm:basis-full">{confirmState?.error ?? cancelState?.error}</p>
      )}
    </div>
  )
}
