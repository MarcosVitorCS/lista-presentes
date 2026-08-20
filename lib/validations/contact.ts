import { z } from 'zod'

// Mesmo estilo de identifyGuestSchema (lib/validations/guest.ts): campos com
// mensagem de erro em português própria, trim onde faz sentido.
export const EVENT_TYPES = [
  { value: 'casamento', label: 'Casamento' },
  { value: 'cha-de-cozinha', label: 'Chá de cozinha' },
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'formatura', label: 'Formatura' },
  { value: 'corporativo', label: 'Evento corporativo' },
  { value: 'outro', label: 'Outro' },
] as const

export const GUEST_COUNT_RANGES = [
  { value: 'ate-50', label: 'Até 50' },
  { value: '51-100', label: '51–100' },
  { value: '101-200', label: '101–200' },
  { value: '201-500', label: '201–500' },
  { value: 'mais-de-500', label: 'Mais de 500' },
] as const

// Sentinela pro campo de data — não é uma data real, é a opção explícita
// "ainda não definida" que o briefing pediu ao lado do input de data.
export const EVENT_DATE_UNDEFINED = 'indefinida'

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
  email: z.string().trim().min(1, 'Informe um e-mail.').email('Informe um e-mail válido.'),
  whatsapp: z.string().trim().min(8, 'Informe um WhatsApp válido.').max(30),
  eventType: z.enum(EVENT_TYPES.map((t) => t.value) as [string, ...string[]]),
  guestCount: z.enum(GUEST_COUNT_RANGES.map((g) => g.value) as [string, ...string[]]),
  // Aceita uma data (YYYY-MM-DD, formato nativo de <input type="date">) ou o
  // sentinela "indefinida" — nunca string vazia (o campo sempre manda algo).
  eventDate: z.string().trim().min(1).max(20),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>
