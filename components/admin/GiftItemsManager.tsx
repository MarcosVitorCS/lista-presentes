'use client'

import { useActionState } from 'react'
import { createGiftItem, updateGiftItem } from '@/app/actions/catalog'
import type { Database } from '@/types/database'

type GiftItemRow = Database['public']['Tables']['gift_items']['Row']

const inputClass =
  'rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900'

export function GiftItemsManager({ listId, items }: { listId: string; items: GiftItemRow[] }) {
  return (
    <div className="flex flex-col gap-8">
      <NewItemForm listId={listId} />
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum item cadastrado ainda.</p>
        ) : (
          items.map((item) => <ItemRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}

function NewItemForm({ listId }: { listId: string }) {
  const [state, action, pending] = useActionState(createGiftItem, undefined)

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-dashed border-zinc-300 p-4">
      <p className="text-sm font-medium text-zinc-900">Adicionar item</p>
      <input type="hidden" name="listId" value={listId} />
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
        <input name="imageUrl" type="url" placeholder="URL da imagem (opcional)" className={inputClass} />
      </div>
      <textarea name="description" placeholder="Descrição (opcional)" rows={2} className={inputClass} />
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

function ItemRow({ item }: { item: GiftItemRow }) {
  const [state, action, pending] = useActionState(updateGiftItem, undefined)

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <input type="hidden" name="itemId" value={item.id} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <input
          name="imageUrl"
          type="url"
          defaultValue={item.image_url ?? ''}
          placeholder="URL da imagem"
          className={inputClass}
        />
      </div>
      <textarea name="description" defaultValue={item.description ?? ''} rows={2} className={inputClass} />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" name="isActive" defaultChecked={item.is_active} />
          Ativo (visível pros convidados)
        </label>
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
