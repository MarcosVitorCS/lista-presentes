import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

/**
 * Data Access Layer para a área administrativa — segue o padrão descrito em
 * node_modules/next/dist/docs/01-app/02-guides/authentication.md.
 *
 * O proxy.ts faz uma checagem OTIMISTA (só pra UX/redirect rápido). Esta é a
 * checagem REAL: toda page/Server Action/Route Handler administrativa deve
 * chamar verifyAdminSession() (ou getAdminEvent()) explicitamente — nunca
 * confiar só no proxy. `cache()` evita revalidar mais de uma vez por render.
 */
export const verifyAdminSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }

  return { userId: user.id, email: user.email ?? null }
})

type EventRow = Database['public']['Tables']['events']['Row']

/**
 * Erro de CONFIGURAÇÃO, não de autenticação: a sessão é válida, mas não há
 * vínculo em event_admins para este usuário (bootstrap incompleto, ou admin
 * removido de todos os eventos). Nunca redirecionar pra /admin/login nesse
 * caso — o usuário JÁ está autenticado, e o proxy.ts, ao ver uma sessão
 * válida em /admin/login, redireciona de volta pra /admin/dashboard. Isso
 * cria um loop infinito de redirect (o navegador mostra tela em branco
 * travada, sem erro visível). Em vez disso, lançamos um erro e deixamos
 * app/admin/dashboard/error.tsx renderizar uma mensagem de verdade.
 */
export class AdminWithoutEventError extends Error {
  constructor() {
    super('Sua conta não está vinculada a nenhum evento.')
    this.name = 'AdminWithoutEventError'
  }
}

/**
 * Resolve o evento administrado pelo usuário logado. MVP assume um admin =
 * um evento (pega o primeiro vínculo); a query já está pronta para quando
 * existir mais de um eventos_admins por admin (SaaS futuro) — nesse caso o
 * chamador decide como escolher/oferecer troca de evento.
 */
export const getAdminEvent = cache(async (): Promise<EventRow> => {
  const { userId } = await verifyAdminSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_admins')
    .select('events(*)')
    .eq('admin_id', userId)
    .limit(1)
    .maybeSingle()

  if (error || !data?.events) {
    throw new AdminWithoutEventError()
  }

  return data.events as EventRow
})
