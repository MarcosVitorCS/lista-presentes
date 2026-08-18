'use client'

import { useState, type ComponentType } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { ReservedGiftCard } from './ReservedGiftCard'
import type { Database } from '@/types/database'

type GiftItemPublic = Database['public']['Views']['gift_items_public']['Row']
export type PixInfo = { key: string | null; ownerName: string | null; qrCodeUrl: string | null }

type PriceBucket = { label: string; min: number; max: number | null }

// Remove acentos via NFD (mesma técnica já usada em lib/validations/occasion.ts)
// pra "cha" encontrar "chá" na busca.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')
function normalize(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(DIACRITICS, '')
}

// Arredonda pra um número "redondo" de acordo com a grandeza do valor, pra
// os rótulos dos filtros lerem "Até R$ 50" em vez de "Até R$ 47".
function roundUpNice(value: number) {
  const step = value < 100 ? 10 : value < 500 ? 50 : value < 2000 ? 100 : 500
  return Math.ceil(value / step) * step
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// Faixas de preço calculadas a partir da distribuição real dos itens
// (tercis), não hardcoded — o Chá de Cozinha (R$15–220) e o Casamento
// (R$97–15.000) têm faixas de preço completamente diferentes.
function computeBuckets(items: GiftItemPublic[]): PriceBucket[] {
  const prices = items
    .map((item) => item.unit_price)
    .filter((price): price is number => price != null)
    .sort((a, b) => a - b)

  // Catálogo pequeno ou sem variação de preço real: um filtro de faixa só
  // acrescentaria ruído à interface sem ajudar em nada.
  if (prices.length < 6) return []

  const p1 = roundUpNice(prices[Math.floor(prices.length * 0.33)])
  const p2 = roundUpNice(prices[Math.floor(prices.length * 0.66)])
  if (p1 <= 0 || p1 >= p2) return []

  return [
    { label: `Até ${formatBRL(p1)}`, min: 0, max: p1 },
    { label: `${formatBRL(p1)} – ${formatBRL(p2)}`, min: p1, max: p2 },
    { label: `Acima de ${formatBRL(p2)}`, min: p2, max: null },
  ]
}

export function GiftCatalog({
  items,
  pix,
  ItemCard,
}: {
  items: GiftItemPublic[]
  pix: PixInfo
  ItemCard: ComponentType<{ item: GiftItemPublic; pix: PixInfo }>
}) {
  const [query, setQuery] = useState('')
  const [bucketIndex, setBucketIndex] = useState<number | null>(null)
  const [reservedExpanded, setReservedExpanded] = useState(false)
  // ids que estavam disponíveis quando este catálogo montou. Confirmar uma
  // reserva chama revalidatePath no servidor, que atualiza `items` sem
  // reload de página — sem isso, o item some da grade disponível (e do
  // GiftItemCard que está mostrando "PIX registrado! Finalize o pagamento
  // com a chave abaixo:") no exato momento em que o convidado precisa
  // copiar a chave. Uma vez mostrado como interativo nesta sessão, o item
  // continua sendo renderizado pelo ItemCard (que sabe mostrar seu próprio
  // estado de sucesso) em vez de "rebaixado" pro card compacto de
  // "Já escolhido" no meio do fluxo.
  const [initialAvailableIds] = useState(
    () => new Set(items.filter((item) => item.quantity_available > 0).map((item) => item.id))
  )

  const buckets = computeBuckets(items)
  const activeBucket = bucketIndex != null ? buckets[bucketIndex] : null

  // Disponibilidade é a divisão de mais alto nível — sempre em seções
  // separadas, nunca misturadas na mesma grade (é o ponto central do pedido:
  // indisponível não pode competir visualmente com disponível).
  const available: GiftItemPublic[] = []
  const reserved: GiftItemPublic[] = []
  for (const item of items) {
    if (item.quantity_available > 0 || initialAvailableIds.has(item.id)) available.push(item)
    else reserved.push(item)
  }

  const normalizedQuery = normalize(query)
  const hasQuery = normalizedQuery.length > 0
  const hasBucket = activeBucket != null
  const hasActiveFilter = hasQuery || hasBucket

  function matches(item: GiftItemPublic) {
    if (hasQuery && !normalize(item.name).includes(normalizedQuery)) return false
    if (activeBucket) {
      if (item.unit_price == null) return false
      if (item.unit_price < activeBucket.min) return false
      if (activeBucket.max != null && item.unit_price > activeBucket.max) return false
    }
    return true
  }

  // Disponível > relevância da busca > nome — nunca ordenação alfabética
  // pura. A "relevância" aqui é simples (nome começa com o termo vence),
  // suficiente pra um catálogo de dezenas de itens.
  function sortItems(list: GiftItemPublic[]) {
    return list.slice().sort((a, b) => {
      if (hasQuery) {
        const aStarts = normalize(a.name).startsWith(normalizedQuery) ? 0 : 1
        const bStarts = normalize(b.name).startsWith(normalizedQuery) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts
      }
      return a.name.localeCompare(b.name, 'pt-BR')
    })
  }

  const filteredAvailable = sortItems(available.filter(matches))
  const filteredReserved = sortItems(reserved.filter(matches))

  const noResultsAtAll = hasActiveFilter && filteredAvailable.length === 0 && filteredReserved.length === 0
  const allReservedDefault = !hasActiveFilter && available.length === 0 && items.length > 0
  // Buscando/filtrando e não sobrou nenhum disponível, mas achou algo entre
  // os já escolhidos: abre a seção sozinha — nesse contexto é informação
  // relevante, não ruído (o convidado quer saber se já foi escolhido).
  const forceReservedOpen = hasActiveFilter && filteredAvailable.length === 0 && filteredReserved.length > 0
  const reservedOpen = reservedExpanded || forceReservedOpen

  function clearFilters() {
    setQuery('')
    setBucketIndex(null)
  }

  let statusLine: string
  if (hasQuery && hasBucket) {
    statusLine = `${filteredAvailable.length} ${filteredAvailable.length === 1 ? 'presente encontrado' : 'presentes encontrados'}`
  } else if (hasQuery) {
    statusLine = `${filteredAvailable.length} ${filteredAvailable.length === 1 ? 'presente' : 'presentes'} para "${query.trim()}"`
  } else if (hasBucket) {
    statusLine = `${filteredAvailable.length} ${filteredAvailable.length === 1 ? 'presente' : 'presentes'} ${activeBucket.label.toLowerCase()}`
  } else {
    statusLine = `${available.length} ${available.length === 1 ? 'presente disponível' : 'presentes disponíveis'} · ${items.length} no total`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Busca + filtro de preço: sticky (fica visível durante a rolagem),
          mas com hierarquia visual baixa — fundo translúcido, sem borda
          pesada — pra não competir com os presentes. */}
      <div className="sticky top-0 z-10 -mx-5 flex flex-col gap-3 bg-canvas/95 px-5 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="relative">
          <Search
            size={17}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="O que você gostaria de presentear?"
            aria-label="Buscar presente pelo nome"
            className="w-full rounded-full border border-canvas-line bg-canvas py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {buckets.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <FilterChip label="Todos" active={bucketIndex === null} onClick={() => setBucketIndex(null)} />
            {buckets.map((bucket, i) => (
              <FilterChip key={bucket.label} label={bucket.label} active={bucketIndex === i} onClick={() => setBucketIndex(i)} />
            ))}
          </div>
        )}

        <p className="text-xs text-ink-soft">{statusLine}</p>
      </div>

      {noResultsAtAll ? (
        <div className="rounded-[var(--radius)] border border-dashed border-canvas-line bg-canvas-alt px-6 py-12 text-center">
          <p className="mx-auto max-w-[36ch] text-ink-soft">Não encontramos nenhum presente com esses critérios.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-accent-text underline underline-offset-2"
          >
            Limpar filtros
          </button>
        </div>
      ) : allReservedDefault ? (
        <div className="rounded-[var(--radius)] border border-dashed border-canvas-line bg-canvas-alt px-6 py-12 text-center">
          <p className="mx-auto max-w-[36ch] text-ink-soft">Todos os presentes já foram escolhidos ❤️</p>
          <button
            type="button"
            onClick={() => setReservedExpanded(true)}
            className="mt-4 text-sm font-semibold text-accent-text underline underline-offset-2"
          >
            Ver presentes escolhidos
          </button>
        </div>
      ) : filteredAvailable.length === 0 ? (
        <p className="text-sm text-ink-soft">Nenhum presente disponível com esses critérios.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAvailable.map((item) => (
            <ItemCard key={item.id} item={item} pix={pix} />
          ))}
        </div>
      )}

      {reserved.length > 0 && !allReservedDefault && (
        <div className="flex flex-col gap-3 border-t border-canvas-line pt-6">
          <button
            type="button"
            onClick={() => setReservedExpanded((v) => !v)}
            className="flex items-center gap-2 self-start text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            aria-expanded={reservedOpen}
          >
            <ChevronDown
              size={16}
              strokeWidth={1.8}
              className={`transition-transform duration-200 ${reservedOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            Já escolhidos ({filteredReserved.length})
          </button>

          {reservedOpen &&
            (filteredReserved.length === 0 ? (
              <p className="text-sm text-ink-soft">Nenhum presente escolhido corresponde a esses critérios.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReserved.map((item) => (
                  <ReservedGiftCard key={item.id} item={item} />
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-ink-deep bg-ink-deep text-on-deep'
          : 'border-canvas-line bg-canvas text-ink-soft hover:border-accent-strong hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}
