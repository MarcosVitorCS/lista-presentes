'use client'

import { useActionState, useState } from 'react'
import { createReservation } from '@/app/actions/reservations'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
  const [confirmMethod, setConfirmMethod] = useState<'physical' | 'pix' | null>(null)
  const [copied, setCopied] = useState(false)

  const unavailable = item.quantity_available <= 0
  const busy = physicalPending || pixPending
  // Deriva a visibilidade do resumo direto do estado da reserva, em vez de
  // sincronizar com um efeito — assim que uma reserva é confirmada, o
  // resumo já nasce fechado no mesmo render (sem cascata de re-render).
  const dialogOpen = confirmMethod !== null && !physicalState?.success && !pixState?.success

  async function copyPixKey() {
    if (!pix.key) return
    await navigator.clipboard.writeText(pix.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[var(--radius)] border border-canvas-line bg-canvas p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-strong/50 hover:shadow-[0_8px_24px_-12px_rgba(30,50,41,0.25)] sm:gap-3 sm:p-4">
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem vinda do Supabase Storage
        <img src={item.image_url} alt={item.name} className="h-24 w-full rounded-[var(--radius)] object-cover sm:h-40" />
      )}

      <div>
        <h2 className="font-sans text-sm font-semibold text-ink sm:text-base">{item.name}</h2>
        {item.unit_price != null && (
          <p className="mt-0.5 text-sm font-semibold text-accent-text">{formatPrice(item.unit_price)}</p>
        )}
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft sm:text-sm">{item.description}</p>
        )}
        {item.purchase_url && (
          <a
            href={item.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-block text-xs text-accent-text underline underline-offset-2 sm:text-sm"
          >
            Ver sugestão de loja ↗
          </a>
        )}
      </div>

      {physicalState?.success ? (
        <p className="rounded-[var(--radius)] bg-success-soft px-3 py-2 text-xs text-success sm:text-sm">
          Reservado! Obrigado — é só levar no dia do evento.
        </p>
      ) : pixState?.success ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius)] bg-success-soft px-3 py-3 text-xs text-success sm:text-sm">
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pix.qrCodeUrl} alt="QR Code PIX" className="mx-auto h-40 w-40" />
          )}
        </div>
      ) : unavailable ? (
        <p className="rounded-[var(--radius)] bg-canvas-alt px-3 py-2 text-xs text-ink-soft sm:text-sm">
          Já reservado por outro convidado
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {/* Sem size="sm" de propósito: px-6 py-3 do tamanho padrão do
              Button garante uma área de toque perto de 44px — um CTA
              principal compacto demais é o tipo de "otimização" que piora
              a experiência mobile em vez de melhorar. */}
          <Button
            type="button"
            variant="line"
            className="w-full"
            disabled={busy}
            onClick={() => setConfirmMethod('physical')}
          >
            {/* Rótulo mais curto no mobile: em card estreito, o texto
                completo quebra em 2 linhas e deixa o card mais alto do que
                precisa — o objetivo explícito era o contrário. */}
            <span className="sm:hidden">Vou levar</span>
            <span className="hidden sm:inline">Vou comprar e levar</span>
          </Button>
          {item.unit_price != null && (
            <Button
              type="button"
              variant="solid"
              className="w-full"
              disabled={busy}
              onClick={() => setConfirmMethod('pix')}
            >
              <span className="sm:hidden">Presentear</span>
              <span className="hidden sm:inline">Presentear com PIX</span>
            </Button>
          )}
        </div>
      )}

      {(physicalState?.error || pixState?.error) && (
        <p className="text-xs text-danger sm:text-sm">{physicalState?.error ?? pixState?.error}</p>
      )}

      <Dialog open={dialogOpen} onClose={() => setConfirmMethod(null)} labelledBy="confirm-title">
        <h3 id="confirm-title" className="font-display text-xl text-ink">
          Seu presente
        </h3>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <Row label="Item" value={item.name} />
          <Row label="Quantidade" value="1" />
          {confirmMethod === 'pix' && item.unit_price != null && (
            <Row label="Valor" value={formatPrice(item.unit_price) ?? ''} />
          )}
          <Row label="Forma" value={confirmMethod === 'pix' ? 'PIX' : 'Físico — você compra e leva'} />
        </dl>

        <form action={confirmMethod === 'pix' ? pixAction : physicalAction} className="mt-6 flex gap-3">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="quantity" value={1} />
          <input type="hidden" name="fulfillmentMethod" value={confirmMethod ?? 'physical'} />
          <Button type="button" variant="line" className="flex-1" onClick={() => setConfirmMethod(null)}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={busy}>
            {busy ? 'Reservando…' : 'Confirmar reserva'}
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
