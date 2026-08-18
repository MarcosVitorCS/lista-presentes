'use client'

import { useActionState } from 'react'
import { createGiftItem, updateGiftItem } from '@/app/actions/catalog'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Database } from '@/types/database'

type GiftItemRow = Database['public']['Tables']['gift_items']['Row']

const fileInputClass =
  'text-sm text-ink-soft file:mr-3 file:rounded-[var(--radius)] file:border-0 file:bg-ink-deep file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-on-deep'

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
          <p className="text-sm text-ink-soft">Nenhum item cadastrado ainda.</p>
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
    <form action={action}>
      <Card tone="canvas-alt" className="flex flex-col gap-4 border-dashed">
        <p className="text-sm font-semibold text-ink">Adicionar item</p>
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="eventId" value={eventId} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-name">Nome</Label>
            <Input id="new-item-name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-qty">Quantidade</Label>
            <Input id="new-item-qty" name="quantityTotal" type="number" min={1} defaultValue={1} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-price">Preço (opcional, R$)</Label>
            <Input id="new-item-price" name="unitPrice" type="number" min={0} step="0.01" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-file">Foto (opcional, até 5MB)</Label>
            <input id="new-item-file" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={fileInputClass} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-item-description">Descrição (opcional)</Label>
          <Textarea id="new-item-description" name="description" rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-item-url">Link sugerido de loja (opcional)</Label>
          <Input id="new-item-url" name="purchaseUrl" type="url" />
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adicionando…' : 'Adicionar'}
        </Button>
      </Card>
    </form>
  )
}

function ItemRow({ item, eventId }: { item: GiftItemRow; eventId: string }) {
  const [state, action, pending] = useActionState(updateGiftItem, undefined)

  return (
    <form action={action}>
      <Card className="flex flex-col gap-4">
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="eventId" value={eventId} />
        <div className="flex flex-col gap-4 sm:flex-row">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage, não é um asset local otimizável
            <img
              src={item.image_url}
              alt={item.name}
              className="h-24 w-24 shrink-0 rounded-[var(--radius)] border border-canvas-line object-cover"
            />
          )}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`name-${item.id}`}>Nome</Label>
              <Input id={`name-${item.id}`} name="name" defaultValue={item.name} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`qty-${item.id}`}>Quantidade</Label>
              <Input id={`qty-${item.id}`} name="quantityTotal" type="number" min={1} defaultValue={item.quantity_total} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`price-${item.id}`}>Preço (opcional)</Label>
              <Input id={`price-${item.id}`} name="unitPrice" type="number" min={0} step="0.01" defaultValue={item.unit_price ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`file-${item.id}`}>{item.image_url ? 'Trocar foto' : 'Adicionar foto'}</Label>
              <input id={`file-${item.id}`} name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={fileInputClass} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`description-${item.id}`}>Descrição</Label>
          <Textarea id={`description-${item.id}`} name="description" defaultValue={item.description ?? ''} rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`url-${item.id}`}>Link sugerido de loja (opcional)</Label>
          <Input id={`url-${item.id}`} name="purchaseUrl" type="url" defaultValue={item.purchase_url ?? ''} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="isActive" defaultChecked={item.is_active} />
              Ativo (visível pros convidados)
            </label>
            {item.image_url && (
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" name="removeImage" />
                Remover foto atual
              </label>
            )}
          </div>
          <p className="text-xs text-ink-soft">
            {item.quantity_reserved} de {item.quantity_total} reservado
          </p>
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" variant="line" disabled={pending} className="self-start">
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
      </Card>
    </form>
  )
}
