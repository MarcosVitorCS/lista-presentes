import { z } from 'zod'

const emptyToUndefined = (val: unknown) => (val === '' || val == null ? undefined : val)

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(200).optional())
const optionalLongText = z.preprocess(emptyToUndefined, z.string().trim().max(600).optional())
const optionalDate = z.preprocess(emptyToUndefined, z.iso.date().optional())
const optionalPixKeyType = z.preprocess(
  emptyToUndefined,
  z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional()
)
const optionalUrl = z.preprocess(emptyToUndefined, z.url('Link inválido.').optional())

// pixQrCodeUrl e imagem principal saem daqui: vêm de upload
// (lib/supabase/storage.ts), tratados separadamente na action.
export const updateEventSettingsSchema = z.object({
  eventId: z.uuid(),
  name: z.string().trim().min(2, 'Nome muito curto.').max(160),
  // Rótulo mostrado acima do nome no hero — hoje "Casamento", mas a
  // plataforma pode futuramente servir outros tipos de evento.
  heroLabel: z.string().trim().min(2, 'Muito curto.').max(60),
  eventDate: optionalDate,
  description: optionalLongText,
  pixKey: optionalText,
  pixKeyType: optionalPixKeyType,
  pixOwnerName: optionalText,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  whatsappUrl: optionalUrl,
  // Checkbox: FormData manda 'on' quando marcado, nada quando desmarcado —
  // z.coerce.boolean() trata string não-vazia como true, null/undefined como
  // false. Mesmo padrão de isActive em updateOccasionSchema.
  allowRsvp: z.coerce.boolean(),
})

export type UpdateEventSettingsInput = z.infer<typeof updateEventSettingsSchema>
