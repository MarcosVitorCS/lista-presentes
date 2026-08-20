'use server'

import { Resend } from 'resend'
import {
  contactFormSchema,
  EVENT_TYPES,
  GUEST_COUNT_RANGES,
  EVENT_DATE_UNDEFINED,
} from '@/lib/validations/contact'

export type ContactActionState = { error?: string; success?: boolean } | undefined

const CONTACT_EMAIL = 'listaae.eventos@gmail.com'

function labelFor(list: ReadonlyArray<{ value: string; label: string }>, value: string) {
  return list.find((item) => item.value === value)?.label ?? value
}

function formatEventDate(value: string) {
  if (value === EVENT_DATE_UNDEFINED) return 'Ainda não definida'
  // <input type="date"> manda YYYY-MM-DD — formata igual ao resto do produto
  // (ver app/(public)/evento/[slug]/page.tsx / EventHome.tsx), sem depender
  // de fuso (T00:00:00 local, não UTC).
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/**
 * Formulário de interesse comercial da landing institucional (/) — não tem
 * nenhuma relação com o fluxo de convidado/evento (identifyGuest, RSVP,
 * reservas). Sem redirect: o requisito é não recarregar a página, o
 * resultado fica só no estado retornado (useActionState).
 *
 * Proteção básica contra spam: honeypot (campo "website", nunca preenchido
 * por humano) + tempo mínimo entre o form montar e ser enviado (bot
 * costuma submeter quase instantaneamente). Os dois falham "com sucesso"
 * de propósito — não avisar um bot que foi barrado só ensina ele a evitar
 * a barreira da próxima vez.
 */
export async function submitContactForm(
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const honeypot = String(formData.get('website') ?? '')
  if (honeypot.trim() !== '') {
    return { success: true }
  }

  const renderedAt = Number(formData.get('formRenderedAt') ?? 0)
  if (renderedAt > 0 && Date.now() - renderedAt < 2500) {
    return { success: true }
  }

  const parsed = contactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    whatsapp: formData.get('whatsapp'),
    eventType: formData.get('eventType'),
    guestCount: formData.get('guestCount'),
    eventDate: formData.get('eventDate'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { name, email, whatsapp, eventType, guestCount, eventDate, message } = parsed.data

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Falha de configuração, não do usuário — mensagem não expõe detalhe
    // técnico, mas dá uma saída (e-mail direto) pra quem tentou contato.
    console.error('submitContactForm: RESEND_API_KEY não configurada.')
    return {
      error: `Não foi possível enviar seu contato agora. Tente novamente ou escreva para ${CONTACT_EMAIL}.`,
    }
  }

  const contactedAt = new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })

  const body = [
    'NOVO INTERESSADO LISTAAE',
    '',
    `Nome: ${name}`,
    `E-mail: ${email}`,
    `WhatsApp: ${whatsapp}`,
    '',
    `Tipo de evento: ${labelFor(EVENT_TYPES, eventType)}`,
    `Data: ${formatEventDate(eventDate)}`,
    `Número de convidados: ${labelFor(GUEST_COUNT_RANGES, guestCount)}`,
    '',
    'Mensagem:',
    message?.trim() || '(sem mensagem)',
    '',
    `Data/hora do contato: ${contactedAt}`,
  ].join('\n')

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      // onboarding@resend.dev só entrega pro próprio e-mail da conta Resend
      // enquanto nenhum domínio for verificado — por isso a conta precisa
      // ser criada com listaae.eventos@gmail.com (ver .env.local.example).
      from: 'Listaae <onboarding@resend.dev>',
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[Listaae] Novo interessado — ${name}`,
      text: body,
    })

    if (error) {
      console.error('submitContactForm: erro do Resend:', error)
      return {
        error: `Não foi possível enviar seu contato agora. Tente novamente ou escreva para ${CONTACT_EMAIL}.`,
      }
    }
  } catch (err) {
    console.error('submitContactForm: falha inesperada ao enviar e-mail:', err)
    return {
      error: `Não foi possível enviar seu contato agora. Tente novamente ou escreva para ${CONTACT_EMAIL}.`,
    }
  }

  return { success: true }
}
