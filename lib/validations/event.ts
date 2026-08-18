import { z } from 'zod'

const emptyToUndefined = (val: unknown) => (val === '' || val == null ? undefined : val)

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(200).optional())
const optionalDate = z.preprocess(emptyToUndefined, z.iso.date().optional())
const optionalPixKeyType = z.preprocess(
  emptyToUndefined,
  z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional()
)

// pixQrCodeUrl saiu daqui: agora vem de upload (lib/supabase/storage.ts),
// tratado separadamente na action, igual às fotos de item.
export const updateEventSettingsSchema = z.object({
  eventId: z.uuid(),
  name: z.string().trim().min(2, 'Nome muito curto.').max(160),
  eventDate: optionalDate,
  pixKey: optionalText,
  pixKeyType: optionalPixKeyType,
  pixOwnerName: optionalText,
})

export type UpdateEventSettingsInput = z.infer<typeof updateEventSettingsSchema>
