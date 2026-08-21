import { Gift } from 'lucide-react'
import { ReservationProgress } from '@/components/public/ReservationProgress'
import { formatGiftPrice } from '@/components/public/gift-card-shared'
import type { Database } from '@/types/database'

type GiftItemPublic = Database['public']['Views']['gift_items_public']['Row']

/**
 * Corpo compartilhado do modal "em foco" dos dois cards de presente. Antes o
 * Dialog só mostrava texto genérico ("Seu presente" + um <dl> com o nome
 * repetido) — a imagem nunca fazia parte do children, não por limitação do
 * Dialog (que aceita qualquer ReactNode), só porque a composição nunca a
 * incluiu. Aqui ela participa de verdade: mesma imagem já pintada no card
 * atrás (mesma src → já em cache do navegador, decodifica na hora, sem novo
 * fetch), nome, descrição, preço e a mesma barra de demanda do card.
 *
 * A imagem sangra até a borda do modal via margin negativo — o recorte com
 * o raio certo (a borda de 1px do <dialog> em volta deixaria uma quina
 * residual se a imagem tivesse seu próprio rounded-t) vem do
 * `overflow: hidden` da classe .gift-dialog em globals.css, não daqui.
 */
export function GiftDialogSummary({ item, titleId }: { item: GiftItemPublic; titleId: string }) {
  const unavailable = item.quantity_available <= 0

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-6 -mt-6">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- mesma imagem já pintada no card, vem do cache do navegador
          <img src={item.image_url} alt="" className="aspect-[16/10] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-canvas-alt">
            <Gift size={32} strokeWidth={1.4} className="text-accent-strong/40" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 id={titleId} className="font-display text-xl text-ink">
          {item.name}
        </h3>
        {item.description && <p className="text-sm text-ink-soft">{item.description}</p>}
        {item.unit_price != null && (
          <p className="text-sm font-semibold tabular-nums text-accent-text">
            {formatGiftPrice(item.unit_price)}
          </p>
        )}
        {!unavailable && <ReservationProgress demandLevel={item.demand_level} />}
      </div>
    </div>
  )
}
