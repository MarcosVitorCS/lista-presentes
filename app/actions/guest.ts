'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setGuestSession } from '@/lib/dal/guest-session'
import { identifyGuestSchema } from '@/lib/validations/guest'

export type IdentifyGuestActionState = { error?: string } | undefined

/**
 * Identificação declarativa do convidado (nome + WhatsApp/e-mail). Chama a
 * RPC identify_guest (SECURITY DEFINER) com a anon key — nenhuma credencial
 * privilegiada envolvida. O evento é resolvido no banco a partir do slug,
 * nunca de um id que o cliente poderia forjar.
 */
export async function identifyGuest(
  _prevState: IdentifyGuestActionState,
  formData: FormData
): Promise<IdentifyGuestActionState> {
  const parsed = identifyGuestSchema.safeParse({
    eventSlug: formData.get('eventSlug'),
    name: formData.get('name'),
    contact: formData.get('contact'),
    contactType: formData.get('contactType'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { eventSlug, name, contact, contactType } = parsed.data
  const supabase = await createClient()

  const { data: guest, error } = await supabase.rpc('identify_guest', {
    p_event_slug: eventSlug,
    p_name: name,
    p_contact: contact,
    p_contact_type: contactType,
  })

  if (error || !guest) {
    return { error: 'Não foi possível identificar você agora. Tente de novo.' }
  }

  await setGuestSession({ guestId: guest.id, eventId: guest.event_id, name: guest.name })

  const next = String(formData.get('next') ?? '/')
  // Só redireciona para caminhos internos — nunca para uma URL absoluta
  // vinda do formulário (evita open redirect).
  redirect(next.startsWith('/') ? next : '/')
}
