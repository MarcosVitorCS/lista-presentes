'use client'

import { useActionState } from 'react'
import { createGiftItem, updateGiftItem } from '@/app/actions/catalog'
import type { Database } from '@/types/database'

type GiftItemRow = Database['public']['Tables']['gift_items']['Row']

const inputClass =
  'rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900'
const fileInputClass =
  'text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white'

export function GiftItemsManager({
  listId,
  eventId,
  items,
}: {
  listId: string
  eventId: string
  items: GiftItemRow[]
}) {
  return (
    <div className="flex flex-col gap-8">
      <NewItemForm listId={listId} eventId={eventId} />
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum item cadastrado ainda.</p>
        ) : (
          items.map((item) => <ItemRow key={item.id} item={item} eventId={eventId} />)
        )}
      </div>
    </div>
  )
}

function NewItemForm({ listId, eventId }: { listId: string; eventId: string }) {
  const [state, action, pending] = useActionState(createGiftItem, undefined)

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-dashed border-zinc-300 p-4">
      <p className="text-sm font-medium text-zinc-900">Adicionar item</p>
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="name" placeholder="Nome" required className={inputClass} />
        <input
          name="quantityTotal"
          type="number"
          min={1}
          defaultValue={1}
          placeholder="Quantidade"
          required
          className={inputClass}
        />
        <input
          name="unitPrice"
          type="number"
          min={0}
          step="0.01"
          placeholder="Preço (opcional, R$)"
          className={inputClass}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Foto (opcional, até 5MB)</label>
          <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={fileInputClass} />
        </div>
      </div>
      <textarea name="description" placeholder="Descrição (opcional)" rows={2} className={inputClass} />
      <input
        name="purchaseUrl"
        type="url"
        placeholder="Link sugerido de loja (opcional)"
        className={inputClass}
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
      >
        {pending ? 'Adicionando…' : 'Adicionar'}
      </button>
    </form>
  )
}

function ItemRow({ item, eventId }: { item: GiftItemRow; eventId: string }) {
  const [state, action, pending] = useActionState(updateGiftItem, undefined)

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="eventId" value={eventId} />
      <div className="flex flex-col gap-3 sm:flex-row">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage, não é um asset local otimizável
          <img
            src={item.image_url}
            alt={item.name}
            className="h-24 w-24 shrink-0 rounded-md border border-zinc-200 object-cover"
          />
        )}
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="name" defaultValue={item.name} required className={inputClass} />
          <input
            name="quantityTotal"
            type="number"
            min={1}
            defaultValue={item.quantity_total}
            required
            className={inputClass}
          />
          <input
            name="unitPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={item.unit_price ?? ''}
            placeholder="Preço (opcional)"
            className={inputClass}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">
              {item.image_url ? 'Trocar foto' : 'Adicionar foto'}
            </label>
            <input
              name="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={fileInputClass}
            />
          </div>
        </div>
      </div>
      <textarea name="description" defaultValue={item.description ?? ''} rows={2} className={inputClass} />
      <input
        name="purchaseUrl"
        type="url"
        defaultValue={item.purchase_url ?? ''}
        placeholder="Link sugerido de loja (opcional)"
        className={inputClass}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" name="isActive" defaultChecked={item.is_active} />
            Ativo (visível pros convidados)
          </label>
          {item.image_url && (
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input type="checkbox" name="removeImage" />
              Remover foto atual
            </label>
          )}
        </div>
        <p className="text-xs text-zinc-400">
          {item.quantity_reserved} de {item.quantity_total} reservado
        </p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md border border-zinc-900 px-4 py-1.5 text-sm font-medium text-zinc-900 transition-opacity disabled:opacity-50"
      >
        {pending ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
