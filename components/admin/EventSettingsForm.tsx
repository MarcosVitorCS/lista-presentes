'use client'

import { useActionState } from 'react'
import { updateEventSettings } from '@/app/actions/event'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useActionToast } from '@/components/ui/Toast'
import type { Database } from '@/types/database'

type EventRow = Database['public']['Tables']['events']['Row']

const fileInputClass =
  'text-sm text-ink-soft file:mr-3 file:rounded-[var(--radius)] file:border-0 file:bg-ink-deep file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-on-deep'

export function EventSettingsForm({ event }: { event: EventRow }) {
  const [state, action, pending] = useActionState(updateEventSettings, undefined)
  useActionToast(state, 'Configurações salvas!')

  return (
    <form action={action} className="flex max-w-xl flex-col gap-6">
      <input type="hidden" name="eventId" value={event.id} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome do casal</Label>
        <Input id="name" name="name" defaultValue={event.name} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eventDate">Data principal</Label>
        <Input id="eventDate" name="eventDate" type="date" defaultValue={event.event_date ?? ''} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição / mensagem para os convidados</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={event.description ?? ''}
          placeholder="Estamos contando os dias para viver esse momento com você."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="imageFile">{event.image_url ? 'Trocar foto principal' : 'Foto principal (opcional, até 5MB)'}</Label>
        <input
          id="imageFile"
          name="imageFile"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className={fileInputClass}
        />
        {event.image_url && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage, não é um asset local otimizável */}
            <img
              src={event.image_url}
              alt="Foto principal atual"
              className="h-24 w-24 rounded-[var(--radius)] border border-canvas-line object-cover"
            />
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="removeImage" />
              Remover foto atual
            </label>
          </div>
        )}
      </div>

      <Card tone="canvas-alt" className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">PIX</p>
          <p className="text-xs text-ink-soft">Exibido pro convidado assim que ele registra uma reserva via PIX.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pixKey">Chave PIX</Label>
          <Input id="pixKey" name="pixKey" defaultValue={event.pix_key ?? ''} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pixKeyType">Tipo da chave</Label>
          <select
            id="pixKeyType"
            name="pixKeyType"
            defaultValue={event.pix_key_type ?? ''}
            className="w-full rounded-[var(--radius)] border border-canvas-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-accent-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="">Selecione…</option>
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
            <option value="email">E-mail</option>
            <option value="phone">Telefone</option>
            <option value="random">Aleatória</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pixOwnerName">Nome do titular</Label>
          <Input id="pixOwnerName" name="pixOwnerName" defaultValue={event.pix_owner_name ?? ''} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pixQrCodeFile">
            {event.pix_qr_code_url ? 'Trocar QR Code' : 'QR Code (opcional, até 5MB)'}
          </Label>
          <input
            id="pixQrCodeFile"
            name="pixQrCodeFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={fileInputClass}
          />
          {event.pix_qr_code_url && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage, não é um asset local otimizável */}
              <img
                src={event.pix_qr_code_url}
                alt="QR Code atual"
                className="h-32 w-32 rounded-[var(--radius)] border border-canvas-line object-contain bg-canvas"
              />
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" name="removePixQrCode" />
                Remover QR Code atual
              </label>
            </div>
          )}
        </div>
      </Card>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}
