import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route
 * Handlers. Usa exclusivamente a anon key — a sessão do admin autenticado
 * (se houver) chega via cookies, e todo acesso a dado continua sujeito a RLS.
 *
 * NUNCA criar um cliente equivalente com a service_role key aqui. Se um dia
 * surgir uma necessidade técnica real para isso, ela deve ser documentada e
 * isolada num módulo separado, nunca misturada com este.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado a partir de um Server Component (não pode escrever
            // cookies). Inofensivo: o proxy.ts é quem garante que a sessão
            // seja atualizada a cada requisição.
          }
        },
      },
    }
  )
}
