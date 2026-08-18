'use client'

import { useActionState } from 'react'
import { updateEventSettings } from '@/app/actions/event'
import type { Database } from '@/types/database'

type EventRow = Database['public']['Tables']['events']['Row']

const inputClass =
  'rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900'

export function EventSettingsForm({ event }: { event: EventRow }) {
  const [state, action, pending] = useActionState(updateEventSettings, undefined)

  return (
    <form action={action} className="flex max-w-xl flex-col gap-5">
      <input type="hidden" name="eventId" value={event.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-zinc-600">
          Nome do evento
        </label>
        <input id="name" name="name" defaultValue={event.name} required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="eventDate" className="text-sm text-zinc-600">
          Data do evento
        </label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          defaultValue={event.event_date ?? ''}
          className={inputClass}
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <legend className="px-1 text-sm font-medium text-zinc-900">PIX</legend>
        <p className="text-xs text-zinc-500">
          Exibido pro convidado assim que ele registra uma reserva via PIX.
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="pixKey" className="text-sm text-zinc-600">
            Chave PIX
          </label>
          <input id="pixKey" name="pixKey" defaultValue={event.pix_key ?? ''} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pixKeyType" className="text-sm text-zinc-600">
            Tipo da chave
          </label>
          <select
            id="pixKeyType"
            name="pixKeyType"
            defaultValue={event.pix_key_type ?? ''}
            className={inputClass}
          >
            <option value="">Selecione…</option>
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
            <option value="email">E-mail</option>
            <option value="phone">Telefone</option>
            <option value="random">Aleatória</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pixOwnerName" className="text-sm text-zinc-600">
            Nome do titular
          </label>
          <input
            id="pixOwnerName"
            name="pixOwnerName"
            defaultValue={event.pix_owner_name ?? ''}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pixQrCodeUrl" className="text-sm text-zinc-600">
            URL do QR Code (opcional)
          </label>
          <input
            id="pixQrCodeUrl"
            name="pixQrCodeUrl"
            type="url"
            defaultValue={event.pix_qr_code_url ?? ''}
            placeholder="https://..."
            className={inputClass}
          />
          {event.pix_qr_code_url && (
            // eslint-disable-next-line @next/next/no-img-element -- imagem vinda de URL externa configurável pelo admin
            <img
              src={event.pix_qr_code_url}
              alt="QR Code atual"
              className="mt-2 h-32 w-32 rounded-md border border-zinc-200 object-contain"
            />
          )}
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Salvo!</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
      >
        {pending ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
