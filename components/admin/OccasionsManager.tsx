'use client'

import { useActionState } from 'react'
import { createOccasion, updateOccasion } from '@/app/actions/occasions'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useActionToast } from '@/components/ui/Toast'
import type { Database } from '@/types/database'

type OccasionRow = Database['public']['Tables']['event_occasions']['Row']
type GiftListRow = Pick<Database['public']['Tables']['gift_lists']['Row'], 'id' | 'name'>

const fileInputClass =
  'text-sm text-ink-soft file:mr-3 file:rounded-[var(--radius)] file:border-0 file:bg-ink-deep file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-on-deep'

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

function GiftListSelect({
  giftLists,
  defaultValue,
}: {
  giftLists: GiftListRow[]
  defaultValue?: string | null
}) {
  return (
    <select
      name="giftListId"
      defaultValue={defaultValue ?? ''}
      className="w-full rounded-[var(--radius)] border border-canvas-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      <option value="">Sem lista vinculada</option>
      {giftLists.map((list) => (
        <option key={list.id} value={list.id}>
          {list.name}
        </option>
      ))}
    </select>
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-name">Nome</Label>
            <Input id="new-name" name="name" placeholder="Chá de Cozinha" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-list">Lista vinculada</Label>
            <GiftListSelect giftLists={giftLists} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-date">Data</Label>
            <Input id="new-date" name="occasionDate" type="date" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-time">Horário</Label>
            <Input id="new-time" name="occasionTime" type="time" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-location">Nome do local</Label>
            <Input id="new-location" name="locationName" placeholder="Mansão das Artes" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-order">Ordem de exibição</Label>
            <Input id="new-order" name="displayOrder" type="number" min={0} defaultValue={0} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-address">Endereço</Label>
          <Input id="new-address" name="address" placeholder="Av. dos Jardins, 850" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-maps">Link do Google Maps (opcional)</Label>
          <Input id="new-maps" name="googleMapsUrl" type="url" placeholder="Deixe em branco para gerar a partir do endereço" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-description">Descrição (opcional)</Label>
          <Textarea id="new-description" name="description" rows={2} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-image">Imagem (opcional, até 5MB)</Label>
          <input id="new-image" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={fileInputClass} />
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adicionando…' : 'Adicionar ocasião'}
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
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">{occasion.name}</p>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="isActive" defaultChecked={occasion.is_active} />
            Ativa (visível na landing)
          </label>
        </div>
        <input type="hidden" name="occasionId" value={occasion.id} />
        <input type="hidden" name="eventId" value={eventId} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${occasion.id}`}>Nome</Label>
            <Input id={`name-${occasion.id}`} name="name" defaultValue={occasion.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`list-${occasion.id}`}>Lista vinculada</Label>
            <GiftListSelect giftLists={giftLists} defaultValue={occasion.gift_list_id} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`date-${occasion.id}`}>Data</Label>
            <Input id={`date-${occasion.id}`} name="occasionDate" type="date" defaultValue={occasion.occasion_date ?? ''} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`time-${occasion.id}`}>Horário</Label>
            <Input
              id={`time-${occasion.id}`}
              name="occasionTime"
              type="time"
              defaultValue={occasion.occasion_time?.slice(0, 5) ?? ''}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`location-${occasion.id}`}>Nome do local</Label>
            <Input id={`location-${occasion.id}`} name="locationName" defaultValue={occasion.location_name ?? ''} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`order-${occasion.id}`}>Ordem de exibição</Label>
            <Input id={`order-${occasion.id}`} name="displayOrder" type="number" min={0} defaultValue={occasion.display_order} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`address-${occasion.id}`}>Endereço</Label>
          <Input id={`address-${occasion.id}`} name="address" defaultValue={occasion.address ?? ''} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`maps-${occasion.id}`}>Link do Google Maps (opcional)</Label>
          <Input id={`maps-${occasion.id}`} name="googleMapsUrl" type="url" defaultValue={occasion.google_maps_url ?? ''} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`description-${occasion.id}`}>Descrição (opcional)</Label>
          <Textarea id={`description-${occasion.id}`} name="description" rows={2} defaultValue={occasion.description ?? ''} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`image-${occasion.id}`}>{occasion.image_url ? 'Trocar imagem' : 'Imagem (opcional)'}</Label>
          <input
            id={`image-${occasion.id}`}
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={fileInputClass}
          />
          {occasion.image_url && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage */}
              <img src={occasion.image_url} alt={occasion.name} className="h-20 w-20 rounded-[var(--radius)] border border-canvas-line object-cover" />
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" name="removeImage" />
                Remover imagem atual
              </label>
            </div>
          )}
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" variant="line" disabled={pending} className="self-start">
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
      </Card>
    </form>
  )
}
