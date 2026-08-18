'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { identifyGuest } from '@/app/actions/guest'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'
import { Input, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function detectContactType(value: string): 'whatsapp' | 'email' {
  return value.includes('@') ? 'email' : 'whatsapp'
}

export function IdentificacaoForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const [contact, setContact] = useState('')
  const [state, action, pending] = useActionState(identifyGuest, undefined)

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="eventSlug" value={DEFAULT_EVENT_SLUG} />
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="contactType" value={detectContactType(contact)} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact">WhatsApp ou e-mail</Label>
        <Input
          id="contact"
          name="contact"
          required
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="(11) 99999-9999 ou voce@email.com"
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Confirmando…' : 'Continuar'}
      </Button>

      <p className="text-xs text-ink-soft">
        Usamos isso só para associar sua reserva ao seu nome — sem senha, sem conta.
      </p>
    </form>
  )
}
