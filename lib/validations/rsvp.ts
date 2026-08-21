import { z } from 'zod'

// Nome de acompanhante: array de strings vindo de múltiplos inputs
// "extraMemberName" no form (formData.getAll). Vazios são descartados aqui
// mesmo — a RPC também ignora string vazia, mas filtrar já no client evita
// mandar linhas em branco desnecessárias.
const memberNameList = z.preprocess(
  (val) => (Array.isArray(val) ? val.filter((v) => typeof v === 'string' && v.trim() !== '') : []),
  z.array(z.string().trim().min(1).max(120)).max(30, 'No máximo 30 pessoas por convite.')
)

export const createInvitationSchema = z.object({
  occasionId: z.uuid(),
  name: z.string().trim().min(2, 'Nome muito curto.').max(120),
  contact: z.string().trim().min(5, 'Informe um WhatsApp ou e-mail válido.').max(160),
  contactType: z.enum(['whatsapp', 'email']),
  extraMemberNames: memberNameList,
})
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>

export const regenerateInvitationSchema = z.object({
  invitationId: z.uuid(),
})

export const deleteInvitationSchema = z.object({
  invitationId: z.uuid(),
})

export const addPartyMemberSchema = z.object({
  invitationId: z.uuid(),
  name: z.string().trim().min(1, 'Informe um nome.').max(120),
})

export const removePartyMemberSchema = z.object({
  partyMemberId: z.uuid(),
})

export const renamePartyMemberSchema = z.object({
  partyMemberId: z.uuid(),
  name: z.string().trim().min(1, 'Informe um nome.').max(120),
})

// confirmedMemberIds vem de checkboxes marcados (formData.getAll) — pode
// vir vazio (ninguém marcado = "não poderei comparecer"). A RPC é quem
// valida de verdade que cada id pertence a este convite.
export const submitRsvpSchema = z.object({
  token: z.string().trim().min(20, 'Convite inválido.').max(200, 'Convite inválido.'),
  confirmedMemberIds: z.preprocess(
    (val) => (Array.isArray(val) ? val : val == null ? [] : [val]),
    z.array(z.uuid())
  ),
})
export type SubmitRsvpInput = z.infer<typeof submitRsvpSchema>
