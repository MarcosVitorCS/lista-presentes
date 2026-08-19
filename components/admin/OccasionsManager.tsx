'use client'

import { useActionState } from 'react'
import { createOccasion, updateOccasion } from '@/app/actions/occasions'
import { Input, Textarea, Select, Field } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useActionToast } from '@/components/ui/Toast'
import type { Database } from '@/types/database'

type OccasionRow = Database['public']['Tables']['event_occasions']['Row']
type GiftListRow = Pick<Database['public']['Tables']['gift_lists']['Row'], 'id' | 'name'>

const fileInputClass =
  'text-sm text-ink-soft file:mr-3 file:min-h-11 file:rounded-[var(--radius)] file:border-0 file:bg-ink-deep file:px-4 file:text-sm file:font-medium file:text-on-deep'

// Alternador com estado visível na linha inteira e 44px de área — eram
// checkboxes nativos colados num texto de 14px.
const toggleClass =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-canvas-line px-3 text-sm text-ink-soft transition-colors duration-[var(--duration-hover)] has-[:checked]:border-accent-strong has-[:checked]:bg-canvas-alt has-[:checked]:text-ink'
const removeToggleClass =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-canvas-line px-3 text-sm text-ink-soft transition-colors duration-[var(--duration-hover)] has-[:checked]:border-danger has-[:checked]:bg-danger-soft has-[:checked]:text-danger'

export function OccasionsManager({
  eventId,
  occasions,
  giftLists,
}: {
  eventId: string
  occasions: OccasionRow[]
  giftLists: GiftListRow[]
}) {
  return (
    <div className="flex flex-col gap-8">
      {occasions
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((occasion) => (
          <OccasionForm key={occasion.id} eventId={eventId} occasion={occasion} giftLists={giftLists} />
        ))}
      <NewOccasionForm eventId={eventId} giftLists={giftLists} />
    </div>
  )
}

/**
 * O select agora RECEBE o id. Antes ele não tinha id nenhum, enquanto os dois
 * rótulos apontavam pra `new-list` e `list-${id}` — htmlFor apontando pro vazio,
 * ou seja, o campo "Lista vinculada" não tinha rótulo associado em lugar
 * nenhum (clicar no texto não focava o campo, e o leitor de tela anunciava
 * apenas "caixa de combinação").
 */
function GiftListSelect({
  id,
  giftLists,
  defaultValue,
  ...props
}: {
  id: string
  giftLists: GiftListRow[]
  defaultValue?: string | null
}) {
  return (
    <Select id={id} name="giftListId" defaultValue={defaultValue ?? ''} {...props}>
      <option value="">Sem lista vinculada</option>
      {giftLists.map((list) => (
        <option key={list.id} value={list.id}>
          {list.name}
        </option>
      ))}
    </Select>
  )
}

function NewOccasionForm({ eventId, giftLists }: { eventId: string; giftLists: GiftListRow[] }) {
  const [state, action, pending] = useActionState(createOccasion, undefined)
  useActionToast(state, 'Ocasião adicionada!')

  return (
    <form action={action}>
      <Card tone="canvas-alt" className="flex flex-col gap-4 border-dashed">
        <p className="text-sm font-semibold text-ink">Adicionar ocasião</p>
        <input type="hidden" name="eventId" value={eventId} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="new-name" label="Nome">
            {(props) => <Input {...props} name="name" placeholder="Chá de Cozinha" required />}
          </Field>
          <Field id="new-list" label="Lista vinculada">
            {(props) => <GiftListSelect {...props} giftLists={giftLists} />}
          </Field>
          <Field id="new-date" label="Data">
            {(props) => <Input {...props} name="occasionDate" type="date" />}
          </Field>
          <Field id="new-time" label="Horário">
            {(props) => <Input {...props} name="occasionTime" type="time" />}
          </Field>
          <Field id="new-location" label="Nome do local">
            {(props) => <Input {...props} name="locationName" placeholder="Mansão das Artes" />}
          </Field>
          <Field id="new-order" label="Ordem de exibição">
            {(props) => (
              <Input {...props} name="displayOrder" type="number" inputMode="numeric" min={0} defaultValue={0} />
            )}
          </Field>
        </div>
        <Field id="new-address" label="Endereço">
          {(props) => <Input {...props} name="address" placeholder="Av. dos Jardins, 850" />}
        </Field>
        <Field
          id="new-maps"
          label="Link do Google Maps"
          hint="Opcional — em branco, geramos a partir do endereço."
        >
          {(props) => <Input {...props} name="googleMapsUrl" type="url" inputMode="url" />}
        </Field>
        <Field id="new-description" label="Descrição" hint="Opcional.">
          {(props) => <Textarea {...props} name="description" rows={2} />}
        </Field>
        <Field id="new-image" label="Imagem" hint="Opcional, até 5MB." error={state?.error}>
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
        <Button type="submit" loading={pending} className="self-start">
          Adicionar ocasião
        </Button>
      </Card>
    </form>
  )
}

function OccasionForm({
  eventId,
  occasion,
  giftLists,
}: {
  eventId: string
  occasion: OccasionRow
  giftLists: GiftListRow[]
}) {
  const [state, action, pending] = useActionState(updateOccasion, undefined)
  useActionToast(state, 'Ocasião salva!')

  return (
    <form action={action}>
      <Card elevation="raise" className="flex flex-col gap-4">
        {/* O nome da ocasião passa a ser um h3 de verdade (era um <p> em
            negrito), então a lista de ocasiões vira uma estrutura navegável
            por cabeçalhos. O badge diz o estado sem precisar ler os
            checkboxes. */}
        <div className="flex flex-col gap-3 border-b border-canvas-line pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-ink">{occasion.name}</h3>
            {!occasion.is_active && <Badge tone="neutral">Oculta</Badge>}
            {occasion.allow_rsvp && <Badge tone="success">RSVP ativo</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className={toggleClass}>
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={occasion.is_active}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Ativa (visível na landing)
            </label>
            <label className={toggleClass}>
              <input
                type="checkbox"
                name="allowRsvp"
                defaultChecked={occasion.allow_rsvp}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Confirmação de presença ativada
            </label>
          </div>
        </div>
        <input type="hidden" name="occasionId" value={occasion.id} />
        <input type="hidden" name="eventId" value={eventId} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id={`name-${occasion.id}`} label="Nome">
            {(props) => <Input {...props} name="name" defaultValue={occasion.name} required />}
          </Field>
          <Field id={`list-${occasion.id}`} label="Lista vinculada">
            {(props) => (
              <GiftListSelect {...props} giftLists={giftLists} defaultValue={occasion.gift_list_id} />
            )}
          </Field>
          <Field id={`date-${occasion.id}`} label="Data">
            {(props) => (
              <Input {...props} name="occasionDate" type="date" defaultValue={occasion.occasion_date ?? ''} />
            )}
          </Field>
          <Field id={`time-${occasion.id}`} label="Horário">
            {(props) => (
              <Input
                {...props}
                name="occasionTime"
                type="time"
                defaultValue={occasion.occasion_time?.slice(0, 5) ?? ''}
              />
            )}
          </Field>
          <Field id={`location-${occasion.id}`} label="Nome do local">
            {(props) => (
              <Input {...props} name="locationName" defaultValue={occasion.location_name ?? ''} />
            )}
          </Field>
          <Field id={`order-${occasion.id}`} label="Ordem de exibição">
            {(props) => (
              <Input
                {...props}
                name="displayOrder"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={occasion.display_order}
              />
            )}
          </Field>
        </div>

        <Field id={`address-${occasion.id}`} label="Endereço">
          {(props) => <Input {...props} name="address" defaultValue={occasion.address ?? ''} />}
        </Field>
        <Field id={`maps-${occasion.id}`} label="Link do Google Maps" hint="Opcional.">
          {(props) => (
            <Input
              {...props}
              name="googleMapsUrl"
              type="url"
              inputMode="url"
              defaultValue={occasion.google_maps_url ?? ''}
            />
          )}
        </Field>
        <Field id={`description-${occasion.id}`} label="Descrição" hint="Opcional.">
          {(props) => (
            <Textarea {...props} name="description" rows={2} defaultValue={occasion.description ?? ''} />
          )}
        </Field>

        <Field
          id={`image-${occasion.id}`}
          label={occasion.image_url ? 'Trocar imagem' : 'Imagem'}
          hint="Opcional."
          error={state?.error}
        >
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
        {occasion.image_url && (
          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage */}
            <img
              src={occasion.image_url}
              alt={occasion.name}
              className="h-20 w-20 rounded-[var(--radius)] border border-canvas-line object-cover"
            />
            <label className={removeToggleClass}>
              <input
                type="checkbox"
                name="removeImage"
                className="h-4 w-4 accent-[var(--color-danger)]"
              />
              Remover imagem atual
            </label>
          </div>
        )}

        <Button type="submit" variant="line" loading={pending} className="self-start">
          Salvar
        </Button>
      </Card>
    </form>
  )
}
