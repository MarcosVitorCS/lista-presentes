'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { submitContactForm } from '@/app/actions/contact'
import { EVENT_TYPES, GUEST_COUNT_RANGES, EVENT_DATE_UNDEFINED } from '@/lib/validations/contact'
import { Field, Input, Select, Textarea, Button } from '@/components/ui'

const INITIAL_VALUES = {
  name: '',
  whatsapp: '',
  email: '',
  eventType: '',
  guestCount: '',
  eventDate: '',
  message: '',
}

/**
 * Formulário de interesse comercial da landing institucional. Não tem
 * nenhuma relação com identificação de convidado (IdentificacaoForm) ou
 * RSVP (RsvpForm) — fluxo, action e schema totalmente separados.
 *
 * Todos os campos são controlados (um `values` só, atualizado por onChange)
 * de propósito: depois que uma Server Action associada a um <form> termina,
 * o React 19 reseta os campos do form — inclusive quando a action retorna
 * erro. Sem controlar os campos, um erro de rede/Resend apagaria tudo que a
 * pessoa já tinha digitado.
 *
 * Confirmado via teste real (não é suposição): pro <input>/<textarea> de
 * texto, manter `value`+`onChange` já é suficiente — o React reconcilia a
 * tempo. Pro <select> e pro checkbox de "data indefinida", não: o reset
 * acontece de um jeito que não é corrigido pelo ciclo normal de render (o
 * estado do React continua certo, mas o elemento do DOM fica dessincronizado
 * silenciosamente). Por isso esses dois têm, além do estado controlado, uma
 * reescrita imperativa direta no DOM via ref, feita depois que o resultado
 * da action chega — a única forma de garantir que o valor visível bate com
 * o que a pessoa realmente preencheu.
 */
export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactForm, undefined)
  const [values, setValues] = useState(INITIAL_VALUES)
  const [dateUnknown, setDateUnknown] = useState(false)

  function setField<K extends keyof typeof INITIAL_VALUES>(key: K, value: (typeof INITIAL_VALUES)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  // Snapshot do que foi de fato submetido, capturado no onSubmit do form
  // (abaixo) — é o que usamos pra restaurar tudo depois de um erro.
  const [submitted, setSubmitted] = useState({ values, dateUnknown })
  const [lastHandledState, setLastHandledState] = useState(state)
  if (state !== lastHandledState) {
    setLastHandledState(state)
    if (state?.error) {
      setValues(submitted.values)
      setDateUnknown(submitted.dateUnknown)
    }
  }

  // Reescrita imperativa pós-reset — ver comentário do componente. Roda
  // depois que `state` muda (ou seja, depois que a action termina), que é
  // exatamente o momento em que o reset automático do React acontece.
  useEffect(() => {
    if (!state?.error) return
    // Busca por id em vez de ref: Select/Input do kit não tipam `ref` na
    // assinatura pública, e isso é só um reforço pontual, não vale mudar o
    // tipo compartilhado por causa disso.
    const eventTypeEl = document.getElementById('contact-event-type') as HTMLSelectElement | null
    const guestCountEl = document.getElementById('contact-guest-count') as HTMLSelectElement | null
    const dateUnknownEl = document.getElementById('contact-event-date-unknown') as HTMLInputElement | null
    if (eventTypeEl) eventTypeEl.value = submitted.values.eventType
    if (guestCountEl) guestCountEl.value = submitted.values.guestCount
    if (dateUnknownEl) dateUnknownEl.checked = submitted.dateUnknown
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só precisa rodar quando `state` muda, `submitted` é lido no momento, não é gatilho
  }, [state])

  // Timestamp de quando o form apareceu na tela — sinal anti-spam (ver
  // app/actions/contact.ts). Setado direto no DOM via ref (input
  // não-controlado), nunca por props/estado do React — assim o HTML do
  // servidor não carrega nenhum valor pra "combinar" no client, e não há
  // setState dentro de efeito (regra do eslint-plugin-react-hooks). Se o JS
  // nunca carregar (envio via progressive enhancement puro), o campo fica
  // vazio e o action trata isso como "sem sinal", nunca como spam.
  const formRenderedAtRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (formRenderedAtRef.current) formRenderedAtRef.current.value = String(Date.now())
  }, [])

  if (state?.success) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-canvas-line bg-canvas p-8 text-center"
      >
        <p className="font-display text-xl text-ink">Recebemos seu contato!</p>
        <p className="text-body-md text-ink-soft">
          Em breve entraremos em contato com você.
        </p>
      </div>
    )
  }

  return (
    <form
      action={action}
      onSubmit={() => {
        setSubmitted({ values, dateUnknown })
      }}
      className="flex flex-col gap-5"
    >
      {/* Honeypot: invisível pra humano (sr-only, não display:none — bot
          ignora display:none mas preenche campo "escondido" via CSS real
          igual), tabIndex -1 pra nunca ser alcançado navegando por Tab. Sem
          aria-hidden: esconder de leitor de tela um campo ainda focável é
          anti-padrão de acessibilidade, e não faz diferença nenhuma pro bot
          (que não lê ARIA). */}
      <div className="sr-only">
        <label htmlFor="website">Deixe este campo em branco</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="formRenderedAt" ref={formRenderedAtRef} defaultValue="" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Nome">
          {(props) => (
            <Input
              {...props}
              name="name"
              required
              autoComplete="name"
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
            />
          )}
        </Field>
        <Field id="contact-whatsapp" label="WhatsApp">
          {(props) => (
            <Input
              {...props}
              name="whatsapp"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              value={values.whatsapp}
              onChange={(event) => setField('whatsapp', event.target.value)}
            />
          )}
        </Field>
      </div>

      <Field id="contact-email" label="E-mail">
        {(props) => (
          <Input
            {...props}
            type="email"
            name="email"
            required
            autoComplete="email"
            value={values.email}
            onChange={(event) => setField('email', event.target.value)}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="contact-event-type" label="Tipo de evento">
          {(props) => (
            <Select
              {...props}
              name="eventType"
              required
              value={values.eventType}
              onChange={(event) => setField('eventType', event.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="contact-guest-count" label="Número de convidados">
          {(props) => (
            <Select
              {...props}
              name="guestCount"
              required
              value={values.guestCount}
              onChange={(event) => setField('guestCount', event.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {GUEST_COUNT_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field id="contact-event-date" label="Data aproximada do evento">
        {(props) => (
          <div className="flex flex-col gap-2">
            <Input
              {...props}
              type="date"
              name={dateUnknown ? undefined : 'eventDate'}
              disabled={dateUnknown}
              required={!dateUnknown}
              value={values.eventDate}
              onChange={(event) => setField('eventDate', event.target.value)}
            />
            <label
              htmlFor={`${props.id}-unknown`}
              className="flex min-h-6 items-center gap-2 text-sm text-ink-soft"
            >
              <input
                type="checkbox"
                id={`${props.id}-unknown`}
                checked={dateUnknown}
                onChange={(event) => setDateUnknown(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Ainda não tenho uma data definida
            </label>
            {dateUnknown && <input type="hidden" name="eventDate" value={EVENT_DATE_UNDEFINED} />}
          </div>
        )}
      </Field>

      <Field id="contact-message" label="Mensagem" hint="Opcional — conte um pouco mais sobre o seu evento.">
        {(props) => (
          <Textarea
            {...props}
            name="message"
            rows={4}
            value={values.message}
            onChange={(event) => setField('message', event.target.value)}
          />
        )}
      </Field>

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="accent" loading={pending}>
        Quero conhecer a Listaae
      </Button>
    </form>
  )
}
