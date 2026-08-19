'use client'

import { useActionState, useState } from 'react'
import { createReservation } from '@/app/actions/reservations'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
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
  const dialogOpen = open && !state?.success
  // Id único por card — ver comentário em GiftItemCard sobre ids duplicados.
  const titleId = `quota-confirm-title-${item.id}`
  const quantityId = `dialog-quantity-${item.id}`

  async function copyPixKey() {
    if (!pix.key) return
    await navigator.clipboard.writeText(pix.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-3 transition-all duration-[var(--duration-hover)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-accent-strong/50 hover:shadow-float sm:gap-3 sm:p-4">
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem vinda do Supabase Storage
        <img
          src={item.image_url}
          alt={item.name}
          className="h-24 w-full rounded-[var(--radius)] object-cover sm:h-40"
        />
      )}

      <div className="flex flex-col gap-0.5">
        <h2 className="font-sans text-sm font-semibold text-ink sm:text-base">{item.name}</h2>
        <p className="text-sm font-semibold tabular-nums text-accent-text">
          {formatPrice(item.unit_price)} por cota
        </p>
        {item.description && (
          <p className="line-clamp-2 text-xs text-ink-soft sm:text-caption">{item.description}</p>
        )}
        {item.purchase_url && (
          <a
            href={item.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-11 items-center text-xs text-accent-text underline underline-offset-2 sm:min-h-0 sm:text-caption"
          >
            Saiba mais ↗
          </a>
        )}
      </div>

      {/*
        Sem barra de progresso aqui de propósito: a view pública
        (gift_items_public) não expõe quantity_total — só o disponível —
        então não há como calcular "quanto já foi tomado" sem vazar o
        tamanho original da cota, uma fronteira de privacidade proposital
        do schema (ver comentário na migration 00001_init_schema.sql).
      */}
      {!soldOut && (
        <p className="text-xs tabular-nums text-ink-soft">{item.quantity_available} disponíveis</p>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {state?.success ? (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-[var(--radius)] bg-success-soft px-3 py-3 text-xs text-success sm:text-caption"
          >
            <p>PIX registrado! Finalize o pagamento com a chave abaixo:</p>
            {pix.key && (
              <div className="flex items-center justify-between gap-2 rounded border border-success/30 bg-field px-2 py-1">
                <code className="truncate text-xs">{pix.key}</code>
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="flex min-h-11 shrink-0 items-center px-1 text-xs font-semibold underline"
                >
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
          <p className="rounded-[var(--radius)] bg-canvas-alt px-3 py-2 text-xs text-ink-soft sm:text-caption">
            Cotas esgotadas
          </p>
        ) : (
          <Button
            type="button"
            variant="solid"
            className="w-full"
            disabled={pending}
            onClick={() => setOpen(true)}
          >
            <span className="sm:hidden">Presentear</span>
            <span className="hidden sm:inline">Presentear com PIX</span>
          </Button>
        )}

        {state?.error && (
          <p role="alert" className="text-xs font-medium text-danger sm:text-caption">
            {state.error}
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setOpen(false)} labelledBy={titleId}>
        <h3 id={titleId} className="font-display text-xl text-ink">
          Seu presente
        </h3>
        <p className="mt-1 text-caption text-ink-soft">{item.name}</p>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor={quantityId}>Quantas cotas?</Label>
          <Input
            id={quantityId}
            type="number"
            inputMode="numeric"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(event) =>
              setQuantity(Math.min(Math.max(1, Number(event.target.value) || 1), maxQuantity))
            }
            className="w-24 tabular-nums"
          />
        </div>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          {total != null && <Row label="Valor" value={formatPrice(total) ?? ''} />}
          <Row label="Forma" value="PIX" />
        </dl>

        <form action={action} className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="quantity" value={quantity} />
          <input type="hidden" name="fulfillmentMethod" value="pix" />
          <Button type="button" variant="line" className="flex-1" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" className="flex-1" loading={pending}>
            Confirmar reserva
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
      <dd className="text-right font-medium tabular-nums text-ink">{value}</dd>
    </div>
  )
}
