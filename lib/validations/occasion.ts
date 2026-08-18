import { z } from 'zod'

const emptyToUndefined = (val: unknown) => (val === '' || val == null ? undefined : val)

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(300).optional())
const optionalLongText = z.preprocess(emptyToUndefined, z.string().trim().max(600).optional())
const optionalDate = z.preprocess(emptyToUndefined, z.iso.date().optional())
const optionalTime = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.').optional()
)
const optionalUrl = z.preprocess(emptyToUndefined, z.url('Link inválido.').optional())

// Remove acentos via NFD (á -> a + combining acute) e descarta os
// diacríticos combinantes (faixa Unicode ̀-ͯ), evitando digitar
// caracteres de combinação direto no código-fonte.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const createOccasionSchema = z.object({
  eventId: z.uuid(),
  giftListId: z.preprocess(emptyToUndefined, z.uuid().optional()),
  name: z.string().trim().min(2, 'Nome muito curto.').max(160),
  occasionDate: optionalDate,
  occasionTime: optionalTime,
  locationName: optionalText,
  address: optionalText,
  googleMapsUrl: optionalUrl,
  description: optionalLongText,
  displayOrder: z.coerce.number().int().min(0).default(0),
})

export const updateOccasionSchema = createOccasionSchema.omit({ eventId: true }).extend({
  occasionId: z.uuid(),
  isActive: z.coerce.boolean(),
})

export type CreateOccasionInput = z.infer<typeof createOccasionSchema>
export type UpdateOccasionInput = z.infer<typeof updateOccasionSchema>

export { slugify }
