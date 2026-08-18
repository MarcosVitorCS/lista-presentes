import { Gift } from 'lucide-react'
import type { Database } from '@/types/database'

type GiftItemPublic = Database['public']['Views']['gift_items_public']['Row']

function formatPrice(value: number | null) {
  if (value == null) return null
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Versão compacta e sem interação pra seção "Já escolhidos" — deliberadamente
 * um componente diferente do GiftItemCard/QuotaItemCard (não uma variante
 * deles) pra reduzir hierarquia visual de verdade: sem imagem grande, sem
 * botão, sem dialog. O item não pode mais ser reservado, então não faz
 * sentido reaproveitar a UI que existe pra reservar.
 */
export function ReservedGiftCard({ item }: { item: GiftItemPublic }) {
  const price = formatPrice(item.unit_price)

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius)] border border-canvas-line bg-canvas-alt/50 px-3 py-2.5">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem vinda do Supabase Storage
        <img
          src={item.image_url}
          alt=""
          className="h-11 w-11 shrink-0 rounded object-cover grayscale-[40%] opacity-80"
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-canvas text-ink-soft/70">
          <Gift size={16} strokeWidth={1.6} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink-soft">{item.name}</p>
        {price && <p className="text-xs text-ink-soft/70">{price}</p>}
      </div>
      <span className="shrink-0 text-xs font-medium text-ink-soft">Escolhido</span>
    </div>
  )
}
