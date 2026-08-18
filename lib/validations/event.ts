import { z } from 'zod'

const emptyToUndefined = (val: unknown) => (val === '' || val == null ? undefined : val)

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(200).optional())
const optionalLongText = z.preprocess(emptyToUndefined, z.string().trim().max(600).optional())
const optionalDate = z.preprocess(emptyToUndefined, z.iso.date().optional())
const optionalPixKeyType = z.preprocess(
  emptyToUndefined,
  z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional()
)

// pixQrCodeUrl e imagem principal saem daqui: vêm de upload
// (lib/supabase/storage.ts), tratados separadamente na action.
export const updateEventSettingsSchema = z.object({
  eventId: z.uuid(),
  name: z.string().trim().min(2, 'Nome muito curto.').max(160),
  eventDate: optionalDate,
  description: optionalLongText,
  pixKey: optionalText,
  pixKeyType: optionalPixKeyType,
  pixOwnerName: optionalText,
})

export type UpdateEventSettingsInput = z.infer<typeof updateEventSettingsSchema>
