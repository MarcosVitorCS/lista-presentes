import { z } from 'zod'

export const createReservationSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().positive().max(100000),
  fulfillmentMethod: z.enum(['physical', 'pix']),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>

export const reservationIdSchema = z.object({
  reservationId: z.uuid(),
})
