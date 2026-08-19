'use client'

import { useActionState } from 'react'
import { updateEventSettings } from '@/app/actions/event'
import { Input, Textarea, Select, Field } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Heading'
import { useActionToast } from '@/components/ui/Toast'
import type { Database } from '@/types/database'

type EventRow = Database['public']['Tables']['events']['Row']

const fileInputClass =
  'text-sm text-ink-soft file:mr-3 file:min-h-11 file:rounded-[var(--radius)] file:border-0 file:bg-ink-deep file:px-4 file:text-sm file:font-medium file:text-on-deep'

// Rótulo de "remover" com estado visível na linha inteira: eram checkboxes
// nativos colados num texto de 14px, com ~18px de área de toque.
const removeToggleClass =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-canvas-line px-3 text-sm text-ink-soft transition-colors duration-[var(--duration-hover)] has-[:checked]:border-danger has-[:checked]:bg-danger-soft has-[:checked]:text-danger'

export function EventSettingsForm({ event }: { event: EventRow }) {
  const [state, action, pending] = useActionState(updateEventSettings, undefined)
  useActionToast(state, 'Configurações salvas!')

  return (
    <form action={action} className="flex max-w-xl flex-col gap-6 pb-24 sm:pb-0">
      <input type="hidden" name="eventId" value={event.id} />

      <Field id="name" label="Nome do casal">
        {(props) => <Input {...props} name="name" defaultValue={event.name} required />}
      </Field>

      <Field
        id="heroLabel"
        label="Rótulo do evento"
        hint={'Aparece acima do nome na página principal. Ex.: "Casamento", "Aniversário de 15 anos".'}
      >
        {(props) => <Input {...props} name="heroLabel" defaultValue={event.hero_label} required />}
      </Field>

      <Field id="eventDate" label="Data principal">
        {(props) => (
          <Input
            {...props}
            name="eventDate"
            type="date"
            defaultValue={event.event_date ?? ''}
            className="w-full sm:w-56"
          />
        )}
      </Field>

      <Field id="description" label="Descrição / mensagem para os convidados">
        {(props) => (
          <Textarea
            {...props}
            name="description"
            rows={3}
            defaultValue={event.description ?? ''}
            placeholder="Estamos contando os dias para viver esse momento com você."
          />
        )}
      </Field>

      <Field
        id="imageFile"
        label={event.image_url ? 'Trocar foto principal' : 'Foto principal'}
        hint="Opcional, até 5MB."
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
      {event.image_url && (
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage */}
          <img
            src={event.image_url}
            alt="Foto principal atual"
            className="h-24 w-24 rounded-[var(--radius)] border border-canvas-line object-cover"
          />
          <label className={removeToggleClass}>
            <input type="checkbox" name="removeImage" className="h-4 w-4 accent-[var(--color-danger)]" />
            Remover foto atual
          </label>
        </div>
      )}

      <Card tone="canvas-alt" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow>PIX</Eyebrow>
          <p className="text-caption text-ink-soft">
            Exibido pro convidado assim que ele registra uma reserva via PIX.
          </p>
        </div>

        <Field id="pixKey" label="Chave PIX">
          {(props) => <Input {...props} name="pixKey" defaultValue={event.pix_key ?? ''} />}
        </Field>

        <Field id="pixKeyType" label="Tipo da chave">
          {(props) => (
            <Select {...props} name="pixKeyType" defaultValue={event.pix_key_type ?? ''} className="sm:w-56">
              <option value="">Selecione…</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Aleatória</option>
            </Select>
          )}
        </Field>

        <Field id="pixOwnerName" label="Nome do titular">
          {(props) => <Input {...props} name="pixOwnerName" defaultValue={event.pix_owner_name ?? ''} />}
        </Field>

        <Field
          id="pixQrCodeFile"
          label={event.pix_qr_code_url ? 'Trocar QR Code' : 'QR Code'}
          hint="Opcional, até 5MB."
        >
          {(props) => (
            <input
              {...props}
              name="pixQrCodeFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={fileInputClass}
            />
          )}
        </Field>
        {event.pix_qr_code_url && (
          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage */}
            <img
              src={event.pix_qr_code_url}
              alt="QR Code atual"
              className="h-32 w-32 rounded-[var(--radius)] border border-canvas-line bg-canvas object-contain"
            />
            <label className={removeToggleClass}>
              <input
                type="checkbox"
                name="removePixQrCode"
                className="h-4 w-4 accent-[var(--color-danger)]"
              />
              Remover QR Code atual
            </label>
          </div>
        )}
      </Card>

      <Card tone="canvas-alt" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow>Redes sociais</Eyebrow>
          <p className="text-caption text-ink-soft">
            Opcional. Os links preenchidos aparecem no rodapé do site.
          </p>
        </div>

        <Field id="instagramUrl" label="Instagram">
          {(props) => (
            <Input
              {...props}
              name="instagramUrl"
              type="url"
              inputMode="url"
              placeholder="https://instagram.com/..."
              defaultValue={event.instagram_url ?? ''}
            />
          )}
        </Field>

        <Field id="facebookUrl" label="Facebook">
          {(props) => (
            <Input
              {...props}
              name="facebookUrl"
              type="url"
              inputMode="url"
              placeholder="https://facebook.com/..."
              defaultValue={event.facebook_url ?? ''}
            />
          )}
        </Field>

        <Field id="youtubeUrl" label="YouTube">
          {(props) => (
            <Input
              {...props}
              name="youtubeUrl"
              type="url"
              inputMode="url"
              placeholder="https://youtube.com/..."
              defaultValue={event.youtube_url ?? ''}
            />
          )}
        </Field>

        <Field id="whatsappUrl" label="WhatsApp">
          {(props) => (
            <Input
              {...props}
              name="whatsappUrl"
              type="url"
              inputMode="url"
              placeholder="https://wa.me/55..."
              defaultValue={event.whatsapp_url ?? ''}
            />
          )}
        </Field>
      </Card>

      {state?.error && (
        <p role="alert" className="text-caption font-medium text-danger">
          {state.error}
        </p>
      )}

      {/*
        Barra de salvar fixa no mobile. O formulário tem treze campos e dois
        blocos: no celular, "Salvar" ficava a duas telas de rolagem de onde a
        pessoa estava editando. A partir de sm o botão volta a ser inline (a
        barra fixa só faz sentido quando a página é mais alta que a tela).
      */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-canvas-line bg-canvas/95 px-5 py-3 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button type="submit" loading={pending} className="w-full sm:w-auto sm:self-start">
          Salvar
        </Button>
      </div>
    </form>
  )
}
