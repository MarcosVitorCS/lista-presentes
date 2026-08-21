// Compartilhado entre GiftItemCard e QuotaItemCard — os dois cards têm a
// mesma "casca" visual (moldura, imagem, hover), só o corpo de ação difere
// (físico+PIX vs. só PIX com quantidade). Evita que classe/formatação
// divirja silenciosamente entre os dois arquivos a cada ajuste futuro.

// hover:hover no Tailwind v4 já vem por padrão dentro de
// @media (hover: hover) — mouse real, nunca toque — então o tingimento novo
// entra na mesma lista de utilities de sempre, sem precisar de CSS solto
// nem de nenhum gate manual.
export const GIFT_CARD_CLASS =
  'flex flex-col gap-2.5 rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-3 transition-all duration-[var(--duration-hover)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-accent-strong/50 hover:bg-[color-mix(in_srgb,var(--color-canvas)_95%,var(--color-accent)_5%)] hover:shadow-float sm:gap-3 sm:p-4 lg:gap-4 lg:p-5'

export const GIFT_CARD_IMAGE_WRAPPER_CLASS = 'group relative overflow-hidden rounded-[var(--radius)]'

// lg:h-auto lg:aspect-[4/3]: abaixo de lg a altura continua fixa (h-24/h-40,
// inalterado); a partir de lg a imagem cresce em proporção à largura da
// coluna (3 no máximo, ver GiftCatalog) em vez de um pixel igual não
// importa quantas colunas cabem na tela.
export function giftCardImageClass(clickable: boolean) {
  return `h-24 w-full object-cover transition-transform duration-[var(--duration-hover)] ease-[var(--ease-out)] sm:h-40 lg:h-auto lg:aspect-[4/3] ${clickable ? 'group-hover:scale-[1.03]' : ''}`
}

export const GIFT_CARD_TITLE_CLASS = 'font-sans text-sm font-semibold text-ink sm:text-base lg:text-lg'

export const GIFT_CARD_DESCRIPTION_CLASS = 'line-clamp-2 text-xs text-ink-soft sm:text-caption lg:line-clamp-3'

export function formatGiftPrice(value: number | null) {
  if (value == null) return null
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
