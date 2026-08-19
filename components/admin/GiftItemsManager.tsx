'use client'

import { useActionState } from 'react'
import { createGiftItem, updateGiftItem } from '@/app/actions/catalog'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { useActionToast } from '@/components/ui/Toast'
import type { Database } from '@/types/database'

type GiftItemRow = Database['public']['Tables']['gift_items']['Row']

// min-h-11 no botão nativo do file input: é o alvo de toque mais apertado dos
// formulários do admin.
const fileInputClass =
  'text-sm text-ink-soft file:mr-3 file:min-h-11 file:rounded-[var(--radius)] file:border-0 file:bg-ink-deep file:px-4 file:text-sm file:font-medium file:text-on-deep'

function formatPrice(value: number | null) {
  if (value == null) return null
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-caption text-ink-soft">Nenhum item cadastrado ainda.</p>
        ) : (
          items.map((item) => <ItemRow key={item.id} item={item} eventId={eventId} />)
        )}
      </div>
    </div>
  )
}

function NewItemForm({ listId, eventId }: { listId: string; eventId: string }) {
  const [state, action, pending] = useActionState(createGiftItem, undefined)
  useActionToast(state, 'Item adicionado!')

  return (
    <form action={action}>
      <Card tone="canvas-alt" className="flex flex-col gap-4 border-dashed">
        <p className="text-sm font-semibold text-ink">Adicionar item</p>
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="eventId" value={eventId} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="new-item-name" label="Nome">
            {(props) => <Input {...props} name="name" required />}
          </Field>
          <Field id="new-item-qty" label="Quantidade">
            {(props) => (
              <Input
                {...props}
                name="quantityTotal"
                type="number"
                inputMode="numeric"
                min={1}
                defaultValue={1}
                required
              />
            )}
          </Field>
          <Field id="new-item-price" label="Preço" hint="Opcional, em reais.">
            {(props) => (
              <Input {...props} name="unitPrice" type="number" inputMode="decimal" min={0} step="0.01" />
            )}
          </Field>
          <Field id="new-item-file" label="Foto" hint="Opcional, até 5MB.">
            {(props) => (
              <input
                {...props}
                name="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={fileInputClass}
              />
            )}
          </Field>
        </div>
        <Field id="new-item-description" label="Descrição" hint="Opcional.">
          {(props) => <Textarea {...props} name="description" rows={2} />}
        </Field>
        <Field id="new-item-url" label="Link sugerido de loja" hint="Opcional." error={state?.error}>
          {(props) => <Input {...props} name="purchaseUrl" type="url" />}
        </Field>
        <Button type="submit" loading={pending} className="self-start">
          Adicionar
        </Button>
      </Card>
    </form>
  )
}

/**
 * Cada item vira uma linha resumida que EXPANDE para edição, em vez de um
 * formulário de seis campos sempre aberto. Com 60 itens cadastrados, a página
 * anterior era uma pilha de 60 formulários idênticos: impossível de varrer com
 * o olho, e cara de renderizar.
 *
 * `<details>` nativo — zero JavaScript adicional, teclado e leitor de tela já
 * funcionam de graça. O `<form>` vive dentro do details, então o estado do
 * formulário só existe quando aberto; nada foi tirado da tela, só recolhido.
 */
function ItemRow({ item, eventId }: { item: GiftItemRow; eventId: string }) {
  const [state, action, pending] = useActionState(updateGiftItem, undefined)
  useActionToast(state, 'Item salvo!')

  const price = formatPrice(item.unit_price)
  const claimedPct =
    item.quantity_total > 0 ? Math.round((item.quantity_reserved / item.quantity_total) * 100) : 0

  return (
    <details className="group rounded-[var(--radius-lg)] border border-canvas-line bg-canvas open:shadow-raise">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage
          <img
            src={item.image_url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-[var(--radius)] border border-canvas-line object-cover"
          />
        ) : (
          <span className="h-11 w-11 shrink-0 rounded-[var(--radius)] border border-dashed border-canvas-line" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
          <span className="mt-0.5 flex items-center gap-2 text-xs tabular-nums text-ink-soft">
            {price ? <span>{price}</span> : null}
            <span>
              {item.quantity_reserved}/{item.quantity_total} reservado
            </span>
          </span>
        </span>
        {!item.is_active && (
          <Badge tone="neutral" className="shrink-0">
            Oculto
          </Badge>
        )}
        {/* O chevron é o único elemento puramente decorativo aqui, e por isso
            é um caractere rotacionado em vez de um ícone importado. */}
        <span
          aria-hidden="true"
          className="shrink-0 text-xs text-ink-soft transition-transform duration-[var(--duration-hover)] group-open:rotate-180"
        >
          ▾
        </span>
      </summary>

      <div className="px-4 pb-4">
        <div className="mb-4 flex flex-col gap-1.5">
          <Progress value={claimedPct} label={`Reservado de ${item.name}`} />
        </div>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id={`name-${item.id}`} label="Nome">
              {(props) => <Input {...props} name="name" defaultValue={item.name} required />}
            </Field>
            <Field id={`qty-${item.id}`} label="Quantidade">
              {(props) => (
                <Input
                  {...props}
                  name="quantityTotal"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  defaultValue={item.quantity_total}
                  required
                />
              )}
            </Field>
            <Field id={`price-${item.id}`} label="Preço" hint="Opcional.">
              {(props) => (
                <Input
                  {...props}
                  name="unitPrice"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  defaultValue={item.unit_price ?? ''}
                />
              )}
            </Field>
            <Field id={`file-${item.id}`} label={item.image_url ? 'Trocar foto' : 'Adicionar foto'}>
              {(props) => (
                <input
                  {...props}
                  name="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className={fileInputClass}
                />
              )}
            </Field>
          </div>
          <Field id={`description-${item.id}`} label="Descrição">
            {(props) => (
              <Textarea {...props} name="description" defaultValue={item.description ?? ''} rows={2} />
            )}
          </Field>
          <Field id={`url-${item.id}`} label="Link sugerido de loja" hint="Opcional.">
            {(props) => (
              <Input {...props} name="purchaseUrl" type="url" defaultValue={item.purchase_url ?? ''} />
            )}
          </Field>

          {/* Os dois checkboxes ganham área de toque e estado visível na linha
              inteira — eram texto de 14px com um quadradinho nativo colado. */}
          <div className="flex flex-wrap gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-canvas-line px-3 text-sm text-ink-soft transition-colors duration-[var(--duration-hover)] has-[:checked]:border-accent-strong has-[:checked]:bg-canvas-alt has-[:checked]:text-ink">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={item.is_active}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Ativo (visível pros convidados)
            </label>
            {item.image_url && (
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-canvas-line px-3 text-sm text-ink-soft transition-colors duration-[var(--duration-hover)] has-[:checked]:border-danger has-[:checked]:bg-danger-soft has-[:checked]:text-danger">
                <input type="checkbox" name="removeImage" className="h-4 w-4 accent-[var(--color-danger)]" />
                Remover foto atual
              </label>
            )}
          </div>

          {state?.error && (
            <p role="alert" className="text-caption font-medium text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" variant="line" loading={pending} className="self-start">
            Salvar
          </Button>
        </form>
      </div>
    </details>
  )
}
