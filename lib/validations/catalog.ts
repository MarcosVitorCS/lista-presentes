import { z } from 'zod'

const emptyToUndefined = (val: unknown) => (val === '' || val == null ? undefined : val)

const optionalPositiveNumber = z.preprocess(
  (val) => (emptyToUndefined(val) === undefined ? undefined : Number(val)),
  z.number().positive().optional()
)

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(500).optional())

// imageUrl saiu daqui de propósito: a imagem agora vem de upload
// (lib/supabase/storage.ts), tratado separadamente nas actions — não é mais
// um campo de texto que o usuário digita.
export const createGiftItemSchema = z.object({
  listId: z.uuid(),
  eventId: z.uuid(),
  name: z.string().trim().min(2, 'Nome muito curto.').max(160),
  description: optionalText,
  unitPrice: optionalPositiveNumber,
  quantityTotal: z.coerce.number().int().positive('Quantidade precisa ser maior que zero.'),
})

export const updateGiftItemSchema = createGiftItemSchema
  .omit({ listId: true })
  .extend({
    itemId: z.uuid(),
    isActive: z.coerce.boolean(),
  })

export type CreateGiftItemInput = z.infer<typeof createGiftItemSchema>
export type UpdateGiftItemInput = z.infer<typeof updateGiftItemSchema>
