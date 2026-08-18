import { z } from 'zod'

const emptyToUndefined = (val: unknown) => (val === '' || val == null ? undefined : val)

export const createInvitationSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto.').max(120),
  contact: z.string().trim().min(5, 'Informe um WhatsApp ou e-mail válido.').max(160),
  contactType: z.enum(['whatsapp', 'email']),
  maxPartySize: z.coerce.number().int().min(1, 'Mínimo 1 pessoa.').max(50, 'Máximo 50 pessoas.'),
})
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>

export const regenerateInvitationSchema = z.object({
  guestId: z.uuid(),
})

// status/partySize vêm de um form público (sem autenticação) — validação
// aqui é só a primeira camada de UX; a RPC submit_rsvp é quem de fato
// confere party_size contra o limite do convite no servidor.
export const submitRsvpSchema = z
  .object({
    token: z.string().trim().min(20, 'Convite inválido.').max(200, 'Convite inválido.'),
    status: z.enum(['confirmed', 'declined']),
    partySize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).optional()),
  })
  .refine((data) => data.status !== 'confirmed' || data.partySize !== undefined, {
    message: 'Informe quantas pessoas vão comparecer.',
    path: ['partySize'],
  })
export type SubmitRsvpInput = z.infer<typeof submitRsvpSchema>
