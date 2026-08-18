'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthActionState = { error?: string } | undefined

export async function adminLogin(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mensagem genérica de propósito — não confirmar se o e-mail existe.
    return { error: 'E-mail ou senha inválidos.' }
  }

  redirect('/admin/dashboard')
}

export async function adminLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
