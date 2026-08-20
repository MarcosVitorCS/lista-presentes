'use client'

import { useActionState, useRef, useState } from 'react'
import { createReservation } from '@/app/actions/reservations'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { ReservationProgress } from '@/components/public/ReservationProgress'
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
  // Origem visual do Dialog (components/ui/Dialog.tsx, prop originRef): o
  // card inteiro, não um botão específico — o efeito precisa ler como "o
  // presente cresceu", não "o botão cresceu".
  const cardRef = useRef<HTMLDivElement>(null)

  const unavailable = item.quantity_available <= 0
  const busy = physicalPending || pixPending
  // Deriva a visibilidade do resumo direto do estado da reserva, em vez de
  // sincronizar com um efeito.
  const dialogOpen = confirmMethod !== null && !physicalState?.success && !pixState?.success
  // O id do título precisa ser único por card: o catálogo renderiza dezenas
  // de Dialog na mesma página e todos usavam id="confirm-title". Ids
  // duplicados quebram o aria-labelledby (o leitor de tela resolve sempre
  // para o primeiro do documento, não para o modal aberto).
  const titleId = `confirm-title-${item.id}`

  async function copyPixKey() {
    if (!pix.key) return
    await navigator.clipboard.writeText(pix.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      ref={cardRef}
      className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-3 transition-all duration-[var(--duration-hover)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-accent-strong/50 hover:shadow-float sm:gap-3 sm:p-4"
    >
      {item.image_url && (
        // Entrada adicional pro dialog de confirmação (os dois botões de
        // ação abaixo continuam intactos) — 'physical' como padrão porque é
        // o único método sempre disponível quando o item não está esgotado;
        // PIX depende de ter preço. Só vira botão quando há algo pra fazer.
        <button
          type="button"
          disabled={unavailable}
          onClick={() => setConfirmMethod('physical')}
          className="group relative overflow-hidden rounded-[var(--radius)] disabled:cursor-default"
          aria-label={unavailable ? item.name : `Ver ${item.name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem vinda do Supabase Storage */}
          <img
            src={item.image_url}
            alt=""
            className={`h-24 w-full object-cover transition-transform duration-[var(--duration-hover)] ease-[var(--ease-out)] sm:h-40 ${unavailable ? '' : 'group-hover:scale-[1.03]'}`}
          />
          {!unavailable && (
            <span className="absolute inset-0 bg-ink-deep/0 transition-colors duration-[var(--duration-hover)] ease-[var(--ease-out)] group-hover:bg-ink-deep/10" />
          )}
        </button>
      )}

      <div className="flex flex-col gap-0.5">
        <h2 className="font-sans text-sm font-semibold text-ink sm:text-base">{item.name}</h2>
        {item.unit_price != null && (
          <p className="text-sm font-semibold tabular-nums text-accent-text">
            {formatPrice(item.unit_price)}
          </p>
        )}
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
            Ver sugestão de loja ↗
          </a>
        )}
      </div>

      {!unavailable && <ReservationProgress demandLevel={item.demand_level} />}

      {/* mt-auto: com títulos e descrições de alturas diferentes, os botões de
          dois cards vizinhos paravam em alturas distintas na grade. */}
      <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
        {physicalState?.success ? (
          <p
            role="status"
            className="rounded-[var(--radius)] bg-success-soft px-3 py-2 text-xs text-success sm:text-caption"
          >
            Reservado! Obrigado — é só levar no dia do evento.
          </p>
        ) : pixState?.success ? (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-[var(--radius)] bg-success-soft px-3 py-3 text-xs text-success sm:text-caption"
          >
            <p>PIX registrado! Finalize o pagamento com a chave abaixo:</p>
            {pix.key && (
              <div className="flex items-center justify-between gap-2 rounded border border-success/30 bg-field px-2 py-1">
                <code className="truncate text-xs">{pix.key}</code>
                {/* min-h-11: copiar a chave PIX é a ação mais importante desta
                    etapa do fluxo e era um dos menores alvos da tela. */}
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pix.qrCodeUrl} alt="QR Code PIX" className="mx-auto h-40 w-40" />
            )}
          </div>
        ) : unavailable ? (
          <p className="rounded-[var(--radius)] bg-canvas-alt px-3 py-2 text-xs text-ink-soft sm:text-caption">
            Já reservado por outro convidado
          </p>
        ) : (
          <>
            {/* Sem size="sm" de propósito: o tamanho padrão do Button garante
                44px de área de toque — um CTA principal compacto demais é o
                tipo de "otimização" que piora a experiência mobile. */}
            <Button
              type="button"
              variant="line"
              className="w-full"
              disabled={busy}
              onClick={() => setConfirmMethod('physical')}
            >
              {/* Rótulo mais curto no mobile: em card estreito, o texto
                  completo quebra em 2 linhas e deixa o card mais alto. */}
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
          </>
        )}

        {(physicalState?.error || pixState?.error) && (
          <p role="alert" className="text-xs font-medium text-danger sm:text-caption">
            {physicalState?.error ?? pixState?.error}
          </p>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setConfirmMethod(null)}
        labelledBy={titleId}
        originRef={cardRef}
        className="gift-dialog"
      >
        <h3 id={titleId} className="font-display text-xl text-ink">
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

        {/* flex-col-reverse no mobile: a ação de confirmar fica embaixo do
            polegar e acima de "Cancelar" na ordem visual, sem trocar a ordem
            do DOM (o foco por teclado continua Cancelar → Confirmar). */}
        <form
          action={confirmMethod === 'pix' ? pixAction : physicalAction}
          className="mt-6 flex flex-col-reverse gap-3 sm:flex-row"
        >
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="quantity" value={1} />
          <input type="hidden" name="fulfillmentMethod" value={confirmMethod ?? 'physical'} />
          <Button
            type="button"
            variant="line"
            className="flex-1"
            onClick={() => setConfirmMethod(null)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="accent" className="flex-1" loading={busy}>
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
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  )
}
