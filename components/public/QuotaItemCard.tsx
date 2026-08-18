'use client'

import { useActionState, useState } from 'react'
import { createReservation } from '@/app/actions/reservations'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const soldOut = item.quantity_available <= 0
  const maxQuantity = Math.max(item.quantity_available, 1)
  const total = item.unit_price != null ? item.unit_price * quantity : null
  // Mesma lógica de GiftItemCard: deriva do estado em vez de sincronizar via
  // efeito, evitando um render em cascata só pra fechar o resumo.
  const dialogOpen = open && !state?.success

  async function copyPixKey() {
    if (!pix.key) return
    await navigator.clipboard.writeText(pix.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-canvas-line bg-canvas p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-strong/50 hover:shadow-[0_8px_24px_-12px_rgba(30,50,41,0.25)]">
      <div>
        <h2 className="font-sans font-semibold text-ink">{item.name}</h2>
        {item.description && <p className="text-sm text-ink-soft">{item.description}</p>}
        <p className="mt-1 text-sm text-ink-soft">
          {formatPrice(item.unit_price)} por cota · {item.quantity_available} disponíveis
        </p>
        {item.purchase_url && (
          <a
            href={item.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-accent-text underline underline-offset-2"
          >
            Saiba mais ↗
          </a>
        )}
      </div>

      {state?.success ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius)] bg-success-soft px-3 py-3 text-sm text-success">
          <p>PIX registrado! Finalize o pagamento com a chave abaixo:</p>
          {pix.key && (
            <div className="flex items-center justify-between gap-2 rounded border border-success/30 bg-canvas px-2 py-1.5">
              <code className="truncate text-xs">{pix.key}</code>
              <button type="button" onClick={copyPixKey} className="shrink-0 text-xs underline">
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          )}
          {pix.ownerName && <p className="text-xs">Titular: {pix.ownerName}</p>}
          {pix.qrCodeUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- imagem vinda do Supabase Storage
            <img src={pix.qrCodeUrl} alt="QR Code PIX" className="mx-auto h-40 w-40" />
          )}
        </div>
      ) : soldOut ? (
        <p className="rounded-[var(--radius)] bg-canvas-alt px-3 py-2 text-sm text-ink-soft">Cotas esgotadas</p>
      ) : (
        <Button type="button" variant="solid" disabled={pending} onClick={() => setOpen(true)}>
          Presentear com PIX
        </Button>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Dialog open={dialogOpen} onClose={() => setOpen(false)} labelledBy="quota-confirm-title">
        <h3 id="quota-confirm-title" className="font-display text-xl text-ink">
          Seu presente
        </h3>
        <p className="mt-1 text-sm text-ink-soft">{item.name}</p>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor={`dialog-quantity-${item.id}`} className="text-sm text-ink-soft">
            Quantas cotas?
          </label>
          <Input
            id={`dialog-quantity-${item.id}`}
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(event) =>
              setQuantity(Math.min(Math.max(1, Number(event.target.value) || 1), maxQuantity))
            }
            className="w-24"
          />
        </div>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          {total != null && <Row label="Valor" value={formatPrice(total) ?? ''} />}
          <Row label="Forma" value="PIX" />
        </dl>

        <form action={action} className="mt-6 flex gap-3">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="quantity" value={quantity} />
          <input type="hidden" name="fulfillmentMethod" value="pix" />
          <Button type="button" variant="line" className="flex-1" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={pending}>
            {pending ? 'Registrando…' : 'Confirmar reserva'}
          </Button>
        </form>
      </Dialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-canvas-line pb-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  )
}
