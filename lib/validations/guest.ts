import { z } from 'zod'

export const identifyGuestSchema = z.object({
  eventSlug: z.string().min(1),
  name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
  contact: z.string().trim().min(5, 'Informe um WhatsApp ou e-mail válido.').max(160),
  contactType: z.enum(['whatsapp', 'email']),
})

export type IdentifyGuestInput = z.infer<typeof identifyGuestSchema>
