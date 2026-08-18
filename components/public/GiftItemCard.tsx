'use client'

import { useActionState, useState } from 'react'
import { createReservation } from '@/app/actions/reservations'
import type { Database } from '@/types/database'

type GiftItemPublic = Database['public']['Views']['gift_items_public']['Row']

type PixInfo = {
  key: string | null
  ownerName: string | null
  qrCodeUrl: string | null
}

function formatPrice(value: number | null) {
  if (value == null) return null
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function GiftItemCard({ item, pix }: { item: GiftItemPublic; pix: PixInfo }) {
  const [physicalState, physicalAction, physicalPending] = useActionState(createReservation, undefined)
  const [pixState, pixAction, pixPending] = useActionState(createReservation, undefined)
  const [copied, setCopied] = useState(false)

  const unavailable = item.quantity_available <= 0
  const busy = physicalPending || pixPending

  async function copyPixKey() {
    if (!pix.key) return
    await navigator.clipboard.writeText(pix.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem vinda de URL externa configurável pelo admin
        <img src={item.image_url} alt={item.name} className="h-40 w-full rounded-md object-cover" />
      )}

      <div>
        <h2 className="font-medium text-zinc-900">{item.name}</h2>
        {item.description && <p className="text-sm text-zinc-600">{item.description}</p>}
        {item.unit_price != null && (
          <p className="mt-1 text-sm text-zinc-500">{formatPrice(item.unit_price)}</p>
        )}
      </div>

      {physicalState?.success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Reservado! Obrigado — é só levar no dia do evento.
        </p>
      ) : pixState?.success ? (
        <div className="flex flex-col gap-2 rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          <p>PIX registrado! Finalize o pagamento com a chave abaixo:</p>
          {pix.key && (
            <div className="flex items-center justify-between gap-2 rounded border border-emerald-200 bg-white px-2 py-1.5">
              <code className="truncate text-xs">{pix.key}</code>
              <button type="button" onClick={copyPixKey} className="shrink-0 text-xs underline">
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          )}
          {pix.ownerName && <p className="text-xs text-emerald-700">Titular: {pix.ownerName}</p>}
          {pix.qrCodeUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pix.qrCodeUrl} alt="QR Code PIX" className="mx-auto h-40 w-40" />
          )}
        </div>
      ) : unavailable ? (
        <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
          Já reservado por outro convidado
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <form action={physicalAction} className="flex-1">
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="quantity" value={1} />
            <input type="hidden" name="fulfillmentMethod" value="physical" />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md border border-zinc-900 px-3 py-2 text-sm font-medium text-zinc-900 transition-opacity disabled:opacity-50"
            >
              {physicalPending ? 'Reservando…' : 'Vou comprar e levar'}
            </button>
          </form>

          {item.unit_price != null && (
            <form action={pixAction} className="flex-1">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="quantity" value={1} />
              <input type="hidden" name="fulfillmentMethod" value="pix" />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
              >
                {pixPending ? 'Registrando…' : 'Presentear com PIX'}
              </button>
            </form>
          )}
        </div>
      )}

      {(physicalState?.error || pixState?.error) && (
        <p className="text-sm text-red-600">{physicalState?.error ?? pixState?.error}</p>
      )}
    </div>
  )
}
