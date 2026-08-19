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
    // gap-3 e items-start (não items-center): com dois botões empilhados no
    // mobile, centralizar deixava o nome do item flutuando no meio da linha.
    // min-w-0 no bloco de texto é o que permite o nome longo truncar em vez de
    // empurrar os botões fora da tela em 390px.
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="font-semibold text-ink">
          {reservation.gift_items?.name ?? 'Item removido'} · {reservation.quantity}x
        </p>
        <p className="text-caption text-ink-soft">
          {reservation.guests?.name ?? 'Convidado'}
          {reservation.guests?.contact ? ` — ${reservation.guests.contact}` : ''}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-ink-soft">
          {reservation.fulfillment_method === 'pix'
            ? `PIX · ${formatPrice(reservation.declared_amount)}`
            : 'Físico'}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[reservation.status]}>{STATUS_LABEL[reservation.status]}</Badge>

        {!readOnly && reservation.status === 'pending' && reservation.fulfillment_method === 'pix' && (
          <form action={confirmAction}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <Button type="submit" variant="solid" size="sm" loading={confirmPending} disabled={busy}>
              Confirmar PIX
            </Button>
          </form>
        )}

        {!readOnly && reservation.status !== 'cancelled' && (
          <form action={cancelAction}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <Button type="submit" variant="line" size="sm" loading={cancelPending} disabled={busy}>
              Cancelar
            </Button>
          </form>
        )}
      </div>

      {(confirmState?.error || cancelState?.error) && (
        <p role="alert" className="text-caption font-medium text-danger sm:basis-full">
          {confirmState?.error ?? cancelState?.error}
        </p>
      )}
    </div>
  )
}
