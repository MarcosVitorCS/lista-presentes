'use client'

import { useActionState } from 'react'
import { confirmReservation, cancelReservation } from '@/app/actions/reservations'
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

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
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
  const busy = confirmPending || cancelPending

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-zinc-900">
          {reservation.gift_items?.name ?? 'Item removido'} · {reservation.quantity}x
        </p>
        <p className="text-sm text-zinc-600">
          {reservation.guests?.name ?? 'Convidado'}
          {reservation.guests?.contact ? ` — ${reservation.guests.contact}` : ''}
        </p>
        <p className="text-xs text-zinc-400">
          {reservation.fulfillment_method === 'pix'
            ? `PIX · ${formatPrice(reservation.declared_amount)}`
            : 'Físico'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[reservation.status]}`}>
          {STATUS_LABEL[reservation.status]}
        </span>

        {!readOnly && reservation.status === 'pending' && reservation.fulfillment_method === 'pix' && (
          <form action={confirmAction}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-50"
            >
              {confirmPending ? 'Confirmando…' : 'Confirmar PIX'}
            </button>
          </form>
        )}

        {!readOnly && reservation.status !== 'cancelled' && (
          <form action={cancelAction}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <button
              type="submit"
              disabled={busy}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-opacity disabled:opacity-50"
            >
              {cancelPending ? 'Cancelando…' : 'Cancelar'}
            </button>
          </form>
        )}
      </div>

      {(confirmState?.error || cancelState?.error) && (
        <p className="text-sm text-red-600 sm:basis-full">{confirmState?.error ?? cancelState?.error}</p>
      )}
    </div>
  )
}
