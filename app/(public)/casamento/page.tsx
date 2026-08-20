import { permanentRedirect } from 'next/navigation'
import { DEFAULT_EVENT_SLUG } from '@/lib/constants'

// Rota antiga, fixa e não-multi-tenant — mantida só como redirect pra não
// quebrar link/convite já enviado. A rota de verdade agora é
// /evento/[slug]/[list] (app/(public)/evento/[slug]/[list]/page.tsx), que
// resolve a lista por slug real em vez de assumir "a lista de casamento é
// sempre a do evento padrão". 308 (permanente) porque o endereço mudou de
// vez, não é um redirect condicional.
export default function CasamentoRedirectPage() {
  permanentRedirect(`/evento/${DEFAULT_EVENT_SLUG}/casamento`)
}
