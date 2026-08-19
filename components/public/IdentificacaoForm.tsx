'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { identifyGuest } from '@/app/actions/guest'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'
import { Input, Field } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function detectContactType(value: string): 'whatsapp' | 'email' {
  return value.includes('@') ? 'email' : 'whatsapp'
}

export function IdentificacaoForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const [contact, setContact] = useState('')
  const [state, action, pending] = useActionState(identifyGuest, undefined)
  const contactType = detectContactType(contact)

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="eventSlug" value={DEFAULT_EVENT_SLUG} />
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="contactType" value={contactType} />

      <Field id="name" label="Nome completo">
        {(props) => <Input {...props} name="name" required autoComplete="name" />}
      </Field>

      {/*
        O erro da action é do formulário como um todo (contato inválido é o
        caso comum), então ele fica no campo de contato — antes era um <p>
        solto entre o último campo e o botão, sem ligação com nada.
        inputMode alterna com o que a pessoa está digitando: teclado numérico
        pra telefone, teclado de e-mail quando aparece um "@".
      */}
      <Field
        id="contact"
        label="WhatsApp ou e-mail"
        hint="Sem senha e sem criar conta."
        error={state?.error}
      >
        {(props) => (
          <Input
            {...props}
            name="contact"
            required
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            inputMode={contactType === 'email' ? 'email' : 'tel'}
            autoComplete={contactType === 'email' ? 'email' : 'tel'}
            placeholder="(11) 99999-9999 ou voce@email.com"
          />
        )}
      </Field>

      <Button type="submit" loading={pending}>
        Continuar
      </Button>

      <p className="text-xs text-ink-soft">
        Usamos isso só para associar sua reserva ao seu nome — sem senha, sem conta.
      </p>
    </form>
  )
}
