'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { identifyGuest } from '@/app/actions/guest'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'

function detectContactType(value: string): 'whatsapp' | 'email' {
  return value.includes('@') ? 'email' : 'whatsapp'
}

export function IdentificacaoForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const [contact, setContact] = useState('')
  const [state, action, pending] = useActionState(identifyGuest, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="eventSlug" value={DEFAULT_EVENT_SLUG} />
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="contactType" value={detectContactType(contact)} />

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-zinc-600">
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contact" className="text-sm text-zinc-600">
          WhatsApp ou e-mail
        </label>
        <input
          id="contact"
          name="contact"
          required
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="(11) 99999-9999 ou voce@email.com"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
      >
        {pending ? 'Confirmando…' : 'Continuar'}
      </button>

      <p className="text-xs text-zinc-400">
        Usamos isso só para associar sua reserva ao seu nome — sem senha, sem conta.
      </p>
    </form>
  )
}
