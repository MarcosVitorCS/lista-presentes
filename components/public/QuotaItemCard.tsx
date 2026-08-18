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

export function QuotaItemCard({ item, pix }: { item: GiftItemPublic; pix: PixInfo }) {
  const [state, action, pending] = useActionState(createReservation, undefined)
  const [quantity, setQuantity] = useState(1)
  const [copied, setCopied] = useState(false)

  const soldOut = item.quantity_available <= 0
  const maxQuantity = Math.max(item.quantity_available, 1)
  const total = item.unit_price != null ? item.unit_price * quantity : null

  async function copyPixKey() {
    if (!pix.key) return
    await navigator.clipboard.writeText(pix.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <div>
        <h2 className="font-medium text-zinc-900">{item.name}</h2>
        {item.description && <p className="text-sm text-zinc-600">{item.description}</p>}
        <p className="mt-1 text-sm text-zinc-500">
          {formatPrice(item.unit_price)} por cota · {item.quantity_available} disponíveis
        </p>
      </div>

      {state?.success ? (
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
            // eslint-disable-next-line @next/next/no-img-element -- imagem vinda de URL externa configurável pelo admin
            <img src={pix.qrCodeUrl} alt="QR Code PIX" className="mx-auto h-40 w-40" />
          )}
        </div>
      ) : soldOut ? (
        <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-500">Cotas esgotadas</p>
      ) : (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="fulfillmentMethod" value="pix" />
          <div className="flex items-center gap-2">
            <label htmlFor={`quantity-${item.id}`} className="text-sm text-zinc-600">
              Quantas cotas?
            </label>
            <input
              id={`quantity-${item.id}`}
              name="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.min(Math.max(1, Number(event.target.value) || 1), maxQuantity))
              }
              className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          {total != null && <p className="text-sm text-zinc-500">Total: {formatPrice(total)}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {pending ? 'Registrando…' : 'Presentear com PIX'}
          </button>
        </form>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  )
}
